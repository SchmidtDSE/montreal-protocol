/**
 * Integration tests for the ConsumptionCalculator class.
 */

package org.kigalisim.engine.support;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.number.EngineNumber;

/**
 * Integration tests for the ConsumptionCalculator class using real SingleThreadEngine.
 */
public class ConsumptionCalculatorIntegrationTest {

  /**
   * Test that execution fails with non-SingleThreadEngine.
   */
  @Test
  public void testExecuteFailsWithWrongEngineType() {
    ConsumptionCalculator calculator = new ConsumptionCalculator();
    Engine wrongEngine = new Engine() {
      // Minimal implementation to satisfy interface - not used in test
      @Override public int getStartYear() { return 0; }
      @Override public int getEndYear() { return 0; }
      @Override public void setStanza(String newStanza) {}
      @Override public void setApplication(String newApplication) {}
      @Override public void setSubstance(String newSubstance, Boolean checkValid) {}
      @Override public void setSubstance(String newSubstance) {}
      @Override public org.kigalisim.engine.state.Scope getScope() { return null; }
      @Override public void incrementYear() {}
      @Override public int getYear() { return 0; }
      @Override public boolean getIsDone() { return false; }
      @Override public void setStream(String name, EngineNumber value, 
          org.kigalisim.engine.state.YearMatcher yearMatcher, 
          org.kigalisim.engine.state.Scope scope, boolean propagateChanges, String unitsToRecord) {}
      @Override public void setStream(String name, EngineNumber value, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public EngineNumber getStream(String name, 
          org.kigalisim.engine.state.Scope scope, String conversion) { return null; }
      @Override public EngineNumber getStream(String name) { return null; }
      @Override public EngineNumber getStreamRaw(String application, String substance, String stream) { return null; }
      @Override public EngineNumber getGhgIntensity(String application, String substance) { return null; }
      @Override public void defineVariable(String name) {}
      @Override public EngineNumber getVariable(String name) { return null; }
      @Override public void setVariable(String name, EngineNumber value) {}
      @Override public EngineNumber getInitialCharge(String stream) { return null; }
      @Override public EngineNumber getRawInitialChargeFor(String application, String substance, String stream) { return null; }
      @Override public void setInitialCharge(EngineNumber value, String stream, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public EngineNumber getRechargeVolume() { return null; }
      @Override public EngineNumber getRechargeIntensity() { return null; }
      @Override public EngineNumber getRechargeIntensityFor(String application, String substance) { return null; }
      @Override public String getLastSpecifiedUnits(String stream) { return null; }
      @Override public String getLastSpecifiedInUnits(String application, String substance, String stream) { return null; }
      @Override public void setLastSpecifiedUnits(String stream, String units) {}
      @Override public void recharge(EngineNumber volume, EngineNumber intensity, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public void retire(EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public EngineNumber getRetirementRate() { return null; }
      @Override public void recycle(EngineNumber recoveryWithUnits, EngineNumber yieldWithUnits,
          EngineNumber displaceLevel, org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public void equals(EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public EngineNumber getEqualsGhgIntensity() { return null; }
      @Override public EngineNumber getEqualsGhgIntensityFor(String application, String substance) { return null; }
      @Override public EngineNumber getEqualsEnergyIntensity() { return null; }
      @Override public EngineNumber getEqualsEnergyIntensityFor(String application, String substance) { return null; }
      @Override public void changeStream(String stream, EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher, 
          org.kigalisim.engine.state.Scope scope) {}
      @Override public void changeStream(String stream, EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public void cap(String stream, EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher, String displaceTarget) {}
      @Override public void floor(String stream, EngineNumber amount, 
          org.kigalisim.engine.state.YearMatcher yearMatcher, String displaceTarget) {}
      @Override public void replace(EngineNumber amountRaw, String stream, String destinationSubstance,
          org.kigalisim.engine.state.YearMatcher yearMatcher) {}
      @Override public java.util.List<org.kigalisim.engine.serializer.EngineResult> getResults() { return null; }
    };
    
    // Configure calculator
    EngineNumber ghgIntensity = new EngineNumber(BigDecimal.valueOf(2.5), "tCO2e/kg");
    calculator.setConsumptionRaw(ghgIntensity);
    calculator.setStreamName("consumption");

    // Execute and verify exception
    IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
        () -> calculator.execute(wrongEngine));
    assertEquals("ConsumptionCalculator requires a SingleThreadEngine", exception.getMessage());
  }

  /**
   * Test that execution fails when consumptionRaw is not set.
   */
  @Test
  public void testExecuteFailsWithoutConsumptionRaw() {
    ConsumptionCalculator calculator = new ConsumptionCalculator();
    SingleThreadEngine engine = new SingleThreadEngine(2020, 2030);
    
    // Configure calculator without consumptionRaw
    calculator.setStreamName("consumption");

    // Execute and verify exception
    IllegalStateException exception = assertThrows(IllegalStateException.class, 
        () -> calculator.execute(engine));
    assertEquals("consumptionRaw must be set", exception.getMessage());
  }

  /**
   * Test that execution fails when streamName is not set.
   */
  @Test
  public void testExecuteFailsWithoutStreamName() {
    ConsumptionCalculator calculator = new ConsumptionCalculator();
    SingleThreadEngine engine = new SingleThreadEngine(2020, 2030);
    
    // Configure calculator without streamName
    EngineNumber ghgIntensity = new EngineNumber(BigDecimal.valueOf(2.5), "tCO2e/kg");
    calculator.setConsumptionRaw(ghgIntensity);

    // Execute and verify exception
    IllegalStateException exception = assertThrows(IllegalStateException.class, 
        () -> calculator.execute(engine));
    assertEquals("streamName must be set", exception.getMessage());
  }
}