/**
 * Tests for individual recalculation strategy classes.
 */

package org.kigalisim.engine.support;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.state.Scope;

/**
 * Test class for individual recalculation strategy classes.
 *
 * <p>These tests focus on verifying the strategy pattern implementation,
 * proper exception handling, and basic functionality. Full integration
 * testing is covered by existing engine tests.</p>
 */
public class RecalcStrategyTest {

  private Scope testScope;

  /**
   * Set up test data.
   */
  @BeforeEach
  public void setUp() {
    testScope = new Scope("test", "testApp", "testSubstance");
  }

  @Test
  public void testPopulationChangeRecalcStrategyRejectsWrongEngineType() {
    PopulationChangeRecalcStrategy strategy = new PopulationChangeRecalcStrategy(testScope, true);
    Engine wrongEngine = mock(Engine.class); // Use mock for simple type checking

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("PopulationChangeRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testRechargeEmissionsRecalcStrategyRejectsWrongEngineType() {
    RechargeEmissionsRecalcStrategy strategy = new RechargeEmissionsRecalcStrategy(testScope);
    Engine wrongEngine = mock(Engine.class);

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("RechargeEmissionsRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testEolEmissionsRecalcStrategyRejectsWrongEngineType() {
    EolEmissionsRecalcStrategy strategy = new EolEmissionsRecalcStrategy(testScope);
    Engine wrongEngine = mock(Engine.class);

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("EolEmissionsRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testConsumptionRecalcStrategyRejectsWrongEngineType() {
    ConsumptionRecalcStrategy strategy = new ConsumptionRecalcStrategy(testScope);
    Engine wrongEngine = mock(Engine.class);

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("ConsumptionRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testSalesRecalcStrategyRejectsWrongEngineType() {
    SalesRecalcStrategy strategy = new SalesRecalcStrategy(testScope);
    Engine wrongEngine = mock(Engine.class);

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("SalesRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testRetireRecalcStrategyRejectsWrongEngineType() {
    RetireRecalcStrategy strategy = new RetireRecalcStrategy(testScope);
    Engine wrongEngine = mock(Engine.class);

    Exception exception = assertThrows(IllegalArgumentException.class, () -> {
      strategy.execute(wrongEngine);
    });

    assertTrue(exception.getMessage()
        .contains("RetireRecalcStrategy requires a SingleThreadEngine"));
  }

  @Test
  public void testAllStrategiesCanBeInstantiated() {
    // Test that all strategy classes can be instantiated without errors
    assertDoesNotThrow(() -> new PopulationChangeRecalcStrategy(testScope, true));
    assertDoesNotThrow(() -> new ConsumptionRecalcStrategy(testScope));
    assertDoesNotThrow(() -> new SalesRecalcStrategy(testScope));
    assertDoesNotThrow(() -> new RechargeEmissionsRecalcStrategy(testScope));
    assertDoesNotThrow(() -> new EolEmissionsRecalcStrategy(testScope));
    assertDoesNotThrow(() -> new RetireRecalcStrategy(testScope));
  }

  @Test
  public void testStrategiesAcceptNullScope() {
    // Test that strategies handle null scope appropriately (should use engine's scope)
    assertDoesNotThrow(() -> new PopulationChangeRecalcStrategy(null, true));
    assertDoesNotThrow(() -> new ConsumptionRecalcStrategy(null));
    assertDoesNotThrow(() -> new SalesRecalcStrategy(null));
    assertDoesNotThrow(() -> new RechargeEmissionsRecalcStrategy(null));
    assertDoesNotThrow(() -> new EolEmissionsRecalcStrategy(null));
    assertDoesNotThrow(() -> new RetireRecalcStrategy(null));
  }

  @Test
  public void testPopulationChangeAcceptsNullSubtractRecharge() {
    // Test that PopulationChangeRecalcStrategy handles null subtractRecharge
    assertDoesNotThrow(() -> new PopulationChangeRecalcStrategy(testScope, null));
  }

  @Test
  public void testStrategiesImplementRecalcInterface() {
    // Verify all strategies implement the RecalcStrategy interface
    RecalcStrategy popStrategy = new PopulationChangeRecalcStrategy(testScope, true);
    RecalcStrategy consStrategy = new ConsumptionRecalcStrategy(testScope);
    RecalcStrategy salesStrategy = new SalesRecalcStrategy(testScope);

    // Just verify they're non-null and implement the interface
    assertTrue(popStrategy instanceof RecalcStrategy);
    assertTrue(consStrategy instanceof RecalcStrategy);
    assertTrue(salesStrategy instanceof RecalcStrategy);

    final RecalcStrategy rechargeStrategy = new RechargeEmissionsRecalcStrategy(testScope);
    final RecalcStrategy eolStrategy = new EolEmissionsRecalcStrategy(testScope);
    final RecalcStrategy retireStrategy = new RetireRecalcStrategy(testScope);
    assertTrue(rechargeStrategy instanceof RecalcStrategy);
    assertTrue(eolStrategy instanceof RecalcStrategy);
    assertTrue(retireStrategy instanceof RecalcStrategy);
  }
}
