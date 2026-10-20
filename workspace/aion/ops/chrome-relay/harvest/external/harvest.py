#!/usr/bin/env python3
"""Isolated one-time external donor capture. Stdlib + Git only; NEVER runs donor code.
Usage:
  python harvest.py clone --clone-root /ABS/PATH/external-donors
  python harvest.py index --clone-root /ABS/PATH/external-donors --landing /ABS/PATH/harvest-evidence
Clones must live OUTSIDE the AION repository. Commit only reviewed evidence, not clones.
"""
import argparse, hashlib, json, os, re, subprocess
from pathlib import Path

HERE=Path(__file__).resolve().parent
SKIP_PARTS={"node_modules",".git","dist","build",".next","vendor","coverage",".venv","venv","__pycache__","fixtures/private"}
ALLOWED={".ts",".tsx",".js",".jsx",".mjs",".cjs",".py",".rs",".go",".json",".md",".yaml",".yml",".html",".css"}
KEYWORDS={
 "send":["submit","sendmessage","send_message","sendprompt","send_prompt","send-button"],
 "reply.read":["extractresponse","readresponse","readreply","replytext","responsecontent","assistantmessage"],
 "observe":["mutationobserver","observe","observer","watchresponse"],
 "stream":["eventsource","streaming","stream","sse","cursor"],
 "receive.cursor":["cursor","epoch","gap","resume"],
 "receive.identity":["messageid","message_id","conversationid","conversation_id","turnid"],
 "send.correlation":["correlationid","correlation_id","nonce","noreplay","noresend","idempot"],
 "generation.stop":["stopgenerating","stopgeneration","stop-button","cancelgeneration"],
 "model.select":["selectmodel","modelselector","model-picker"],
 "thinking.level.set":["thinkingbudget","reasoning_effort","effortlevel","extendedthinking"],
 "steer":["steer","midturn","queuefollowup"],
 "chat.rename":["renamechat","renameconversation","edit-title"],
 "chat.create":["newchat","createchat","newconversation"],
 "file.attach":["attachfile","fileupload","uploadfile"],
 "message.edit":["editmessage","editprompt","editturn"],
 "response.regenerate":["regenerate","retryresponse","retryanswer"]
}
def cmd(*args, cwd=None, timeout=180):
 return subprocess.run(args,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=True).stdout.strip()
def sha(path):
 h=hashlib.sha256()
 with path.open("rb") as f:
  for b in iter(lambda:f.read(65536),b""):h.update(b)
 return h.hexdigest()
def manifest():
 x=json.loads((HERE/"sources.json").read_text(encoding="utf-8"))
 assert x["schema"]=="aion.external-harvest.sources/1"
 ids=[v["id"] for v in x["donors"]]
 if len(ids)!=len(set(ids)):raise ValueError("duplicate donor ID")
 for v in x["donors"]:
  if not re.fullmatch(r"[a-z0-9-]+",v["id"]):raise ValueError("bad donor ID")
  if v["url"]!="https://github.com/"+v["repository"]:raise ValueError("unapproved donor URL")
 return x
def check_root(root):
 root=root.expanduser().resolve()
 repo=HERE
 while repo!=repo.parent:
  if repo==root or root.is_relative_to(repo):
   raise SystemExit("clone root must live OUTSIDE AION source checkout: "+str(root))
  repo=repo.parent
 return root
def clone(root,donors):
 root=check_root(root)
 root.mkdir(parents=True,exist_ok=True)
 reports=[]
 for v in donors:
  folder=root/v["id"];state={"id":v["id"],"repository":v["repository"],"status":"UNRUN"}
  if folder.exists():
   state["status"]="PRESENT_REUSED_NO_UPDATE"
  else:
   try:
    cmd("git","-c","core.hooksPath=/dev/null","clone","--depth","1","--single-branch","--no-checkout","--",v["url"]+".git",str(folder),timeout=600)
    cmd("git","-c","core.hooksPath=/dev/null","-c","filter.lfs.required=false","-c","filter.lfs.smudge=","checkout","-f","HEAD",cwd=folder,timeout=240)
    state["status"]="CLONED"
   except Exception as e:
    state["status"]="ERROR";state["reason"]=str(e)[:400]
  if (folder/".git").exists():
   try:
    state["commit"]=cmd("git","rev-parse","HEAD",cwd=folder)
    state["dirty"]=bool(cmd("git","status","--porcelain",cwd=folder))
    state["remote"]=cmd("git","remote","get-url","origin",cwd=folder)
   except Exception as e:state["inspection_error"]=str(e)[:300]
  reports.append(state)
 print(json.dumps({"schema":"aion.external-harvest.clone-receipt/1","sources":reports},indent=2))
def index(root,landing,donors):
 root=check_root(root);landing=landing.expanduser().resolve();landing.mkdir(parents=True,exist_ok=True)
 out=[]
 for v in donors:
  folder=root/v["id"]
  if not (folder/".git").exists():out.append({"id":v["id"],"status":"SOURCE_ABSENT"});continue
  sha_head=cmd("git","rev-parse","HEAD",cwd=folder)
  dirty=bool(cmd("git","status","--porcelain",cwd=folder))
  if dirty:out.append({"id":v["id"],"status":"DIRTY_REFUSED","commit":sha_head});continue
  paths=cmd("git","ls-files","-z",cwd=folder).split("\0")
  matches=[];scanned=0
  for rel in paths:
   if not rel:continue
   p=Path(rel)
   if p.suffix.lower() not in ALLOWED or any(part in SKIP_PARTS for part in p.parts):continue
   if any(part.startswith(".env") for part in p.parts) or "secret" in rel.lower() or "token" in rel.lower():continue
   fp=folder/p
   if not fp.is_file() or fp.is_symlink() or fp.stat().st_size>262144:continue
   try:t=fp.read_text(encoding="utf-8")
   except (UnicodeError,OSError):continue
   scanned+=1
   lower=t.lower()
   hits={k:sum(lower.count(w) for w in words) for k,words in KEYWORDS.items()}
   hits={k:n for k,n in hits.items() if n}
   if hits:matches.append({"path":rel.replace(os.sep,"/"),"sha256":sha(fp),"bytes":fp.stat().st_size,"signals":hits})
  matches.sort(key=lambda x:(-sum(x["signals"].values()),x["path"]))
  packet={"schema":"aion.external-harvest.source-index/1","donor_id":v["id"],"upstream":v["url"],"source_commit":sha_head,
          "status":"STATIC_INDEXED_NOT_VERIFIED","tracked_files_scanned":scanned,"candidate_files":len(matches),
          "paths":matches,"warning":"Keyword signals are search leads ONLY, not semantic implementations, licensing, or live proof."}
  path=landing/(v["id"]+"-index.json");path.write_text(json.dumps(packet,indent=2)+"\n",encoding="utf-8")
  out.append({"id":v["id"],"status":packet["status"],"commit":sha_head,"scanned":scanned,"candidates":len(matches),"evidence_path":str(path)})
 print(json.dumps({"schema":"aion.external-harvest.index-receipt/1","results":out},indent=2))
def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("mode",choices=["clone","index"])
 parser.add_argument("--clone-root",type=Path,required=True)
 parser.add_argument("--landing",type=Path)
 args=parser.parse_args()
 donors=manifest()["donors"]
 if args.mode=="clone":clone(args.clone_root,donors)
 else:
  if not args.landing:parser.error("--landing required for index")
  index(args.clone_root,args.landing,donors)
if __name__=="__main__":main()
