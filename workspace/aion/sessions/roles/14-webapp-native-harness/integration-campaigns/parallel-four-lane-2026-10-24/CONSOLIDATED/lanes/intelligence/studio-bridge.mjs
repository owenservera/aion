// Relocated bundle import seam. Original unchanged supplier blob in SOURCE-LEDGER.json.
import { synthesizeWebappAdapter, shadowEvaluateAdapter } from '../../../../../implementations/round8/adaptive-adapter-factory.mjs';
import { assertIndependentAdapterHoldout } from '../../../../../implementations/round9/adapter-holdout-gate.mjs';
import { createAdapterImprovementPipeline } from './pipeline.mjs';
export function createStudioAdapterLearner({verifyCapture,store}) {
  return createAdapterImprovementPipeline({synthesize:synthesizeWebappAdapter,shadowEvaluate:shadowEvaluateAdapter,
    assertIndependentHoldout:assertIndependentAdapterHoldout,verifyCapture,store});
}
