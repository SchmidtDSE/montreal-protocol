/**
 * Live tests for recycle and recover operations using actual QTA files.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.validate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.kigalisim.KigaliSimFacade;
import org.kigalisim.engine.serializer.EngineResult;
import org.kigalisim.lang.program.ParsedProgram;

/**
 * Tests that validate recycle and recover operations in QTA files against expected behavior.
 */
public class RecycleRecoverLiveTests {

  /**
   * Test recycling.qta produces expected values.
   */
  @Test
  public void testRecycling() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "../examples/recycling.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    assertNotNull(program, "Program should not be null");

    // Run the scenario using KigaliSimFacade
    String scenarioName = "result";
    Stream<EngineResult> results = KigaliSimFacade.runScenario(program, scenarioName, progress -> {});

    // Convert to list for multiple access
    List<EngineResult> resultsList = results.collect(Collectors.toList());

    // Check year 1 - no recycling yet
    EngineResult recordYear1 = LiveTestsUtil.getResult(resultsList.stream(), 1, "test", "test");
    assertNotNull(recordYear1, "Should have result for test/test in year 1");
    assertEquals(500.0, recordYear1.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 1");
    assertEquals("tCO2e", recordYear1.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 1");

    // Check year 2 - recycling active
    EngineResult recordYear2 = LiveTestsUtil.getResult(resultsList.stream(), 2, "test", "test");
    assertNotNull(recordYear2, "Should have result for test/test in year 2");
    assertEquals(500.0, recordYear2.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 2");

    // Check recycled consumption in year 2
    assertEquals(500.0 - 437.5, recordYear2.getRecycleConsumption().getValue().doubleValue(), 0.0001,
        "Recycled consumption should be 500 - 437.5 = 62.5 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getRecycleConsumption().getUnits(),
        "Recycled consumption units should be tCO2e in year 2");
  }

  /**
   * Test recycle_by_kg.qta produces expected values.
   */
  @Test
  public void testRecycleByKg() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "../examples/recycle_by_kg.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    assertNotNull(program, "Program should not be null");

    // Run the scenario using KigaliSimFacade
    String scenarioName = "result";
    Stream<EngineResult> results = KigaliSimFacade.runScenario(program, scenarioName, progress -> {});

    // Convert to list for multiple access
    List<EngineResult> resultsList = results.collect(Collectors.toList());

    // Check year 1 - no recycling yet
    EngineResult recordYear1 = LiveTestsUtil.getResult(resultsList.stream(), 1, "test", "test");
    assertNotNull(recordYear1, "Should have result for test/test in year 1");
    assertEquals(500.0, recordYear1.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 1");
    assertEquals("tCO2e", recordYear1.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 1");

    // Check year 2 - recycling active
    EngineResult recordYear2 = LiveTestsUtil.getResult(resultsList.stream(), 2, "test", "test");
    assertNotNull(recordYear2, "Should have result for test/test in year 2");
    assertEquals(500.0, recordYear2.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 2");

    // Check recycled consumption in year 2
    // 25 kg * 5 tCO2e/mt = 25 kg * 5 tCO2e/(1000 kg) = 0.125 tCO2e
    assertEquals(0.125, recordYear2.getRecycleConsumption().getValue().doubleValue(), 0.0001,
        "Recycled consumption should be 0.125 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getRecycleConsumption().getUnits(),
        "Recycled consumption units should be tCO2e in year 2");
  }

  /**
   * Test recycle_by_units.qta produces expected values.
   */
  @Test
  public void testRecycleByUnits() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "../examples/recycle_by_units.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    assertNotNull(program, "Program should not be null");

    // Run the scenario using KigaliSimFacade
    String scenarioName = "result";
    Stream<EngineResult> results = KigaliSimFacade.runScenario(program, scenarioName, progress -> {});

    // Convert to list for multiple access
    List<EngineResult> resultsList = results.collect(Collectors.toList());

    // Check year 1 - no recycling yet
    EngineResult recordYear1 = LiveTestsUtil.getResult(resultsList.stream(), 1, "test", "test");
    assertNotNull(recordYear1, "Should have result for test/test in year 1");
    assertEquals(500.0, recordYear1.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 1");
    assertEquals("tCO2e", recordYear1.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 1");

    // Check year 2 - recycling active
    EngineResult recordYear2 = LiveTestsUtil.getResult(resultsList.stream(), 2, "test", "test");
    assertNotNull(recordYear2, "Should have result for test/test in year 2");
    assertEquals(500.0, recordYear2.getGhgConsumption().getValue().doubleValue(), 0.0001,
        "GHG consumption should be 500 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getGhgConsumption().getUnits(),
        "GHG consumption units should be tCO2e in year 2");

    // Check recycled consumption in year 2
    // 1000 units * 2 kg/unit = 2000 kg, 2000 kg * 5 tCO2e/(1000 kg) = 10 tCO2e
    assertEquals(10.0, recordYear2.getRecycleConsumption().getValue().doubleValue(), 0.0001,
        "Recycled consumption should be 10 tCO2e in year 2");
    assertEquals("tCO2e", recordYear2.getRecycleConsumption().getUnits(),
        "Recycled consumption units should be tCO2e in year 2");
  }

  /**
   * Test recover_displace_sales_kg.qta produces expected displacement values.
   */
  @Test
  public void testRecoverDisplaceSalesKg() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "../examples/recover_displace_sales_kg.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    assertNotNull(program, "Program should not be null");

    // Run the scenario using KigaliSimFacade
    String scenarioName = "result";
    Stream<EngineResult> results = KigaliSimFacade.runScenario(program, scenarioName, progress -> {});

    // Convert to list for multiple access
    List<EngineResult> resultsList = results.collect(Collectors.toList());

    // Check sub_a results - should have displacement effect
    EngineResult recordSubA = LiveTestsUtil.getResult(resultsList.stream(), 1, "test", "sub_a");
    assertNotNull(recordSubA, "Should have result for test/sub_a in year 1");

    // Check that sales were displaced (reduced by 20 kg)
    // Original: 100 kg manufacture + 50 kg import = 150 kg sales
    // After 20 kg displacement: 150 - 20 = 130 kg total
    double totalSales = recordSubA.getManufacture().getValue().doubleValue() 
                       + recordSubA.getImport().getValue().doubleValue();
    assertEquals(130.0, totalSales, 0.0001,
        "Total sales should be reduced by 20 kg due to displacement");
  }

  /**
   * Test recover_displace_substance.qta produces expected displacement values.
   */
  @Test
  public void testRecoverDisplaceSubstance() throws IOException {
    // Load and parse the QTA file
    String qtaPath = "../examples/recover_displace_substance.qta";
    ParsedProgram program = KigaliSimFacade.parseAndInterpret(qtaPath);
    assertNotNull(program, "Program should not be null");

    // Run the scenario using KigaliSimFacade
    String scenarioName = "result";
    Stream<EngineResult> results = KigaliSimFacade.runScenario(program, scenarioName, progress -> {});

    // Convert to list for multiple access
    List<EngineResult> resultsList = results.collect(Collectors.toList());

    // Check sub_b results - should have displacement effect on sub_b sales
    EngineResult recordSubB = LiveTestsUtil.getResult(resultsList.stream(), 1, "test", "sub_b");
    assertNotNull(recordSubB, "Should have result for test/sub_b in year 1");

    // Check that sub_b sales were displaced (reduced by 30 kg)
    // Original: 200 kg manufacture + 100 kg import = 300 kg sales
    // After 30 kg displacement: 300 - 30 = 270 kg total
    double totalSales = recordSubB.getManufacture().getValue().doubleValue() 
                       + recordSubB.getImport().getValue().doubleValue();
    assertEquals(270.0, totalSales, 0.0001,
        "Sub_b total sales should be reduced by 30 kg due to displacement from sub_a recovery");
  }

}
