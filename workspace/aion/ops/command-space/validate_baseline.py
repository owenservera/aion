#!/usr/bin/env python3
"""Read-only integrity validator for AION command-space baseline (stdlib only)."""
import csv
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def read(path):
    with (ROOT/path).open(encoding="utf-8-sig",newline="") as f:
        return list(csv.DictReader(f))
def validate():
    matrix=read("aion_command_matrix.csv")
    core=read("CORE-OPERATIONS.csv")
    origins=read("ROUTE-ORIGINS.csv")
    errors=[]
    opmap={}
    for x in core:
        if x["semantic_id"] in opmap: errors.append("duplicate core: "+x["semantic_id"])
        if x["core_priority"] not in ("P0","P1"): errors.append("invalid core priority: "+x["semantic_id"])
        if not x["effect_class"] or not x["intent"] or not x["critical_distinction"]:errors.append("incomplete core: "+x["semantic_id"])
        opmap[x["semantic_id"]]=x
    keys=set()
    routes=set()
    commands=set()
    for row in matrix:
        route=(row["provider"],row["surface"],row["native_path"],row["transport"])
        key=(*route,row["command"])
        if key in keys: errors.append("duplicate mapping "+str(key))
        keys.add(key);routes.add(route);commands.add(row["command"])
        if row["command"] in opmap and row["priority"]!=opmap[row["command"]]["core_priority"]:
            errors.append("priority mismatch "+str(key))
        if row["priority"] not in ("P0","P1","P2"):
            errors.append("invalid priority "+str(key))
        if row["native_support"] not in ("UNKNOWN","CANDIDATE","DOCUMENTED","NOT_APPLICABLE"):
            errors.append("invalid native status "+str(key))
        if row["aion_status"] not in ("PENDING","PLANNED","OFFLINE_IMPLEMENTED","NOT_APPLICABLE"):
            errors.append("invalid AION status "+str(key))
    if len(routes)*len(commands)!=len(matrix):
        errors.append("matrix not full route x command baseline")
    originkeys=set()
    for row in origins:
        r=(row["provider"],row["surface"],row["native_path"],row["transport"])
        if r in originkeys:errors.append("duplicate route-origin record "+str(r))
        originkeys.add(r)
        if row["route_origin"] not in ("AION_CUSTOM_BROWSER","PROVIDER_NATIVE_CANDIDATE","APP_PLUGIN_INGRESS"):
            errors.append("invalid route origin "+str(r))
        if row["verification"]!="NOT_LIVE_VERIFIED":
            errors.append("unreviewed route falsely claiming live proof "+str(r))
    if originkeys!=routes:
        errors.append("route origin set does not match matrix routes")
    if not opmap.keys()<=commands:errors.append("core operation absent from matrix")
    p0={x["semantic_id"] for x in core if x["core_priority"]=="P0"}
    must={"chat.create","chat.open","chat.rename","send","reply.read","stream","observe","model.select","thinking.level.set","steer","generation.stop","recover"}
    if not must<=p0:errors.append("essential P0 missing "+str(must-p0))
    print({"ok":not errors,"matrix_rows":len(matrix),"commands":len(commands),"routes":len(routes),
       "baseline_operations":len(core),"P0":len(p0),"P1":len(core)-len(p0),
       "route_origins":dict(Counter(x["route_origin"] for x in origins)),"errors":errors[:30]})
    return not errors
if __name__=="__main__":
    raise SystemExit(0 if validate() else 1)
