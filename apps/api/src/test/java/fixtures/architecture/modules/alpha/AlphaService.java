package fixtures.architecture.modules.alpha;

import fixtures.architecture.modules.beta.internal.BetaInternal;

/** Deliberate violation: module "alpha" uses an internal type of module "beta". */
public class AlphaService {

    public String run() {
        return new BetaInternal().value();
    }
}
