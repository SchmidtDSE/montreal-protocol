/**
 * Strategy for recalculating recharge emissions.
 *
 * <p>This strategy encapsulates the logic previously found in the
 * recalcRechargeEmissions method of SingleThreadEngine.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.support;

import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.state.Scope;

/**
 * Strategy for recalculating recharge emissions.
 */
public class RechargeEmissionsRecalcStrategy implements RecalcStrategy {

  private Scope scope;

  /**
   * Create a new RechargeEmissionsRecalcStrategy.
   *
   * @param scope The scope to use for calculations, null to use engine's current scope
   */
  public RechargeEmissionsRecalcStrategy(Scope scope) {
    this.scope = scope;
  }

  @Override
  public void execute(Engine target) {
    if (!(target instanceof SingleThreadEngine)) {
      throw new IllegalArgumentException(
          "RechargeEmissionsRecalcStrategy requires a SingleThreadEngine");
    }

    SingleThreadEngine engine = (SingleThreadEngine) target;

    // Move the logic from SingleThreadEngine.recalcRechargeEmissions
    Scope scopeEffective = scope != null ? scope : engine.getScope();
    EngineNumber rechargeVolume = engine.calculateRechargeVolume();
    EngineNumber rechargeGhg = engine.getUnitConverter().convert(rechargeVolume, "tCO2e");
    engine.setStream("rechargeEmissions", rechargeGhg, null, scopeEffective, false, null);
  }

  @Override
  public void execute(Engine target, RecalcKit kit) {
    // Move the logic from SingleThreadEngine.recalcRechargeEmissions
    Scope scopeEffective = scope != null ? scope : target.getScope();
    EngineNumber rechargeVolume = RechargeVolumeCalculator.calculateRechargeVolume(
        scopeEffective, 
        kit.getStateGetter().orElseThrow(
            () -> new IllegalStateException("StateGetter required for recharge emissions"
            )), 
        kit.getStreamKeeper().orElseThrow(
            () -> new IllegalStateException("StreamKeeper required for recharge emissions"
            )),
        target);
    EngineNumber rechargeGhg = kit.getUnitConverter().orElseThrow(
        () -> new IllegalStateException("UnitConverter required for recharge emissions"
        ))
        .convert(rechargeVolume, "tCO2e");
    target.setStream("rechargeEmissions", rechargeGhg, null, scopeEffective, false, null);
  }
}
