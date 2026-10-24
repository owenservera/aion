// Z.ai integration seam: pin the existing Agent 14 Round 8/9 code instead of forking it.
// Core injects readAcceptance-bound verifyCapture and an atomic existing-store publisher.
import { synthesizeWebappAdapter, shadowEvaluateAdapter } from '../../../../sessions/roles/14-webapp-native-harness/implementations/round8/adaptive-adapter-factory.mjs';
import { assertIndependentAdapterHoldout } from '../../../../sessions/roles/14-webapp-native-harness/implementations/round9/adapter-holdout-gate.mjs';
import { createAdapterImprovementPipeline } from './pipeline.mjs';

export function createStudioAdapterLearner({verifyCapture,store}) {
  return createAdapterImprovementPipeline({synthesize:synthesizeWebappAdapter,
    shadowEvaluate:shadowEvaluateAdapter,assertIndependentHoldout:assertIndependentAdapterHoldout,
    verifyCapture,store});
}
