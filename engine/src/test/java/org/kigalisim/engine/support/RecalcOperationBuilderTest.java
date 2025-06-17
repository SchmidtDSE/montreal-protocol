/**
 * Tests for recalculation strategy classes.
 */

package org.kigalisim.engine.support;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.SingleThreadEngine;
import org.kigalisim.engine.state.Scope;

/**
 * Test class for RecalcOperationBuilder and related classes.
 */
public class RecalcOperationBuilderTest {

  private SingleThreadEngine engine;
  private Scope testScope;

  /**
   * Set up test engine with application and substance context.
   */
  @BeforeEach
  public void setUp() {
    engine = new SingleThreadEngine(1, 10);
    testScope = new Scope("test", "testApp", "testSubstance");
  }

  @Test
  public void testBuilderRequiresInitialRecalc() {
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    
    Exception exception = assertThrows(IllegalStateException.class, () -> {
      builder.thenPropagateToConsumption();
    });
    
    assertTrue(exception.getMessage().contains("Must call a recalc method"));
  }

  @Test
  public void testBuilderPreventsMultipleRecalcs() {
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    builder.recalcPopulationChange();
    
    Exception exception = assertThrows(IllegalStateException.class, () -> {
      builder.recalcConsumption();
    });
    
    assertTrue(exception.getMessage().contains("Only one recalc method can be called"));
  }

  @Test
  public void testBuilderRequiresAtLeastOneStrategy() {
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    
    Exception exception = assertThrows(IllegalStateException.class, () -> {
      builder.build();
    });
    
    assertTrue(exception.getMessage().contains(
        "Must configure at least one recalculation strategy"));
  }

  @Test
  public void testBuilderFluentInterface() {
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    
    RecalcOperation operation = builder
        .setScopeEffective(testScope)
        .setSubtractRecharge(true)
        .recalcPopulationChange()
        .thenPropagateToConsumption()
        .thenPropagateToSales()
        .build();
    
    assertNotNull(operation);
  }

  @Test
  public void testRecalcOperationExecution() {
    // Set up the engine with proper application/substance context
    engine.setStanza("test");
    engine.setApplication("testApp");
    engine.setSubstance("testSubstance");
    
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    
    RecalcOperation operation = builder
        .recalcConsumption()
        .build();
    
    // This should not throw an exception now that we have proper context
    assertDoesNotThrow(() -> operation.execute(engine));
  }

  @Test
  public void testIndvidualStrategies() {
    // Set up the engine with proper application/substance context
    engine.setStanza("test");
    engine.setApplication("testApp");
    engine.setSubstance("testSubstance");
    
    // Test individual strategy creation and execution
    PopulationChangeRecalcStrategy popStrategy = 
        new PopulationChangeRecalcStrategy(testScope, true);
    assertDoesNotThrow(() -> popStrategy.execute(engine));

    ConsumptionRecalcStrategy consumptionStrategy = 
        new ConsumptionRecalcStrategy(testScope);
    assertDoesNotThrow(() -> consumptionStrategy.execute(engine));

    SalesRecalcStrategy salesStrategy = 
        new SalesRecalcStrategy(testScope);
    assertDoesNotThrow(() -> salesStrategy.execute(engine));

    RechargeEmissionsRecalcStrategy rechargeStrategy = 
        new RechargeEmissionsRecalcStrategy(testScope);
    assertDoesNotThrow(() -> rechargeStrategy.execute(engine));

    EolEmissionsRecalcStrategy eolStrategy = 
        new EolEmissionsRecalcStrategy(testScope);
    assertDoesNotThrow(() -> eolStrategy.execute(engine));

    RetireRecalcStrategy retireStrategy = 
        new RetireRecalcStrategy(testScope);
    assertDoesNotThrow(() -> retireStrategy.execute(engine));
  }

  @Test
  public void testAllRecalcMethods() {
    // Test each recalc method can be used as the initial method
    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcPopulationChange().build();
    });

    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcConsumption().build();
    });

    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcSales().build();
    });

    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcRechargeEmissions().build();
    });

    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcEolEmissions().build();
    });

    assertDoesNotThrow(() -> {
      new RecalcOperationBuilder().recalcRetire().build();
    });
  }

  @Test
  public void testAllPropagateMethods() {
    // Set up the engine with proper application/substance context
    engine.setStanza("test");
    engine.setApplication("testApp");
    engine.setSubstance("testSubstance");
    
    RecalcOperationBuilder builder = new RecalcOperationBuilder();
    
    RecalcOperation operation = builder
        .recalcPopulationChange()
        .thenPropagateToConsumption()
        .thenPropagateToSales()
        .thenPropagateToRechargeEmissions()
        .thenPropagateToEolEmissions()
        .thenPropagateToRetire()
        .thenPropagateToPopulationChange()
        .build();
    
    assertNotNull(operation);
    assertDoesNotThrow(() -> operation.execute(engine));
  }
}