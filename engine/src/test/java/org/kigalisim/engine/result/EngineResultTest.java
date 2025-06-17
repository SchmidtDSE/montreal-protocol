/**
 * Tests for EngineResult and EngineResultBuilder classes.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.result;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.serializer.ImportSupplement;

/**
 * Test class for EngineResult and EngineResultBuilder.
 *
 * <p>Tests basic functionality including construction, getters, and builder validation.
 * These tests mirror the JavaScript test coverage for equivalent functionality.</p>
 */
public class EngineResultTest {

  /**
   * Helper method to create a sample ImportSupplement for testing.
   *
   * @return A sample ImportSupplement instance
   */
  private ImportSupplement createSampleImportSupplement() {
    return new ImportSupplement(
        new EngineNumber(new BigDecimal("5"), "kg"),
        new EngineNumber(new BigDecimal("10"), "tCO2e"),
        new EngineNumber(new BigDecimal("2"), "units")
    );
  }

  /**
   * Helper method to create a sample EngineResult for testing.
   *
   * @return A sample EngineResult instance
   */
  private EngineResult createSampleResult() {
    ImportSupplement importSupplement = createSampleImportSupplement();

    return new EngineResult(
        "test app",
        "test substance",
        2023,
        new EngineNumber(new BigDecimal("100"), "kg"),  // manufacture
        new EngineNumber(new BigDecimal("50"), "kg"),   // import
        new EngineNumber(new BigDecimal("25"), "kg"),   // recycle
        new EngineNumber(new BigDecimal("200"), "tCO2e"), // domestic consumption
        new EngineNumber(new BigDecimal("100"), "tCO2e"), // import consumption
        new EngineNumber(new BigDecimal("50"), "tCO2e"),  // recycle consumption
        new EngineNumber(new BigDecimal("1000"), "units"), // population
        new EngineNumber(new BigDecimal("100"), "units"),  // population new
        new EngineNumber(new BigDecimal("300"), "tCO2e"),  // recharge emissions
        new EngineNumber(new BigDecimal("150"), "tCO2e"),  // eol emissions
        new EngineNumber(new BigDecimal("500"), "kWh"),    // energy consumption
        importSupplement
    );
  }

  @Nested
  class EngineResultTests {

    @Test
    void testInitializes() {
      EngineResult result = createSampleResult();
      assertNotNull(result);
    }

    @Test
    void testGetApplication() {
      EngineResult result = createSampleResult();
      assertEquals("test app", result.getApplication());
    }

    @Test
    void testGetSubstance() {
      EngineResult result = createSampleResult();
      assertEquals("test substance", result.getSubstance());
    }

    @Test
    void testGetYear() {
      EngineResult result = createSampleResult();
      assertEquals(2023, result.getYear());
    }

    @Test
    void testGetManufacture() {
      EngineResult result = createSampleResult();
      EngineNumber manufacture = result.getManufacture();
      assertEquals(new BigDecimal("100"), manufacture.getValue());
      assertEquals("kg", manufacture.getUnits());
    }

    @Test
    void testGetImport() {
      EngineResult result = createSampleResult();
      EngineNumber importValue = result.getImport();
      assertEquals(new BigDecimal("50"), importValue.getValue());
      assertEquals("kg", importValue.getUnits());
    }

    @Test
    void testGetRecycle() {
      EngineResult result = createSampleResult();
      EngineNumber recycle = result.getRecycle();
      assertEquals(new BigDecimal("25"), recycle.getValue());
      assertEquals("kg", recycle.getUnits());
    }

    @Test
    void testGetConsumptionNoRecycle() {
      EngineResult result = createSampleResult();
      EngineNumber consumption = result.getConsumptionNoRecycle();
      assertEquals(new BigDecimal("300"), consumption.getValue()); // 200 + 100
      assertEquals("tCO2e", consumption.getUnits());
    }

    @Test
    void testGetGhgConsumption() {
      EngineResult result = createSampleResult();
      EngineNumber ghgConsumption = result.getGhgConsumption();
      assertEquals(new BigDecimal("350"), ghgConsumption.getValue()); // 200 + 100 + 50
      assertEquals("tCO2e", ghgConsumption.getUnits());
    }

    @Test
    void testGetDomesticConsumption() {
      EngineResult result = createSampleResult();
      EngineNumber domestic = result.getDomesticConsumption();
      assertEquals(new BigDecimal("200"), domestic.getValue());
      assertEquals("tCO2e", domestic.getUnits());
    }

    @Test
    void testGetImportConsumption() {
      EngineResult result = createSampleResult();
      EngineNumber importConsumption = result.getImportConsumption();
      assertEquals(new BigDecimal("100"), importConsumption.getValue());
      assertEquals("tCO2e", importConsumption.getUnits());
    }

    @Test
    void testGetRecycleConsumption() {
      EngineResult result = createSampleResult();
      EngineNumber recycleConsumption = result.getRecycleConsumption();
      assertEquals(new BigDecimal("50"), recycleConsumption.getValue());
      assertEquals("tCO2e", recycleConsumption.getUnits());
    }

    @Test
    void testGetPopulation() {
      EngineResult result = createSampleResult();
      EngineNumber population = result.getPopulation();
      assertEquals(new BigDecimal("1000"), population.getValue());
      assertEquals("units", population.getUnits());
    }

    @Test
    void testGetPopulationNew() {
      EngineResult result = createSampleResult();
      EngineNumber populationNew = result.getPopulationNew();
      assertEquals(new BigDecimal("100"), populationNew.getValue());
      assertEquals("units", populationNew.getUnits());
    }

    @Test
    void testGetRechargeEmissions() {
      EngineResult result = createSampleResult();
      EngineNumber rechargeEmissions = result.getRechargeEmissions();
      assertEquals(new BigDecimal("300"), rechargeEmissions.getValue());
      assertEquals("tCO2e", rechargeEmissions.getUnits());
    }

    @Test
    void testGetEolEmissions() {
      EngineResult result = createSampleResult();
      EngineNumber eolEmissions = result.getEolEmissions();
      assertEquals(new BigDecimal("150"), eolEmissions.getValue());
      assertEquals("tCO2e", eolEmissions.getUnits());
    }

    @Test
    void testGetEnergyConsumption() {
      EngineResult result = createSampleResult();
      EngineNumber energyConsumption = result.getEnergyConsumption();
      assertEquals(new BigDecimal("500"), energyConsumption.getValue());
      assertEquals("kWh", energyConsumption.getUnits());
    }

    @Test
    void testGetImportSupplement() {
      EngineResult result = createSampleResult();
      ImportSupplement importSupplement = result.getImportSupplement();
      assertNotNull(importSupplement);
    }

    @Test
    void testConsumptionIncompatibleUnits() {
      ImportSupplement importSupplement = createSampleImportSupplement();

      EngineResult result = new EngineResult(
          "test app",
          "test substance",
          2023,
          new EngineNumber(new BigDecimal("100"), "kg"),
          new EngineNumber(new BigDecimal("50"), "kg"),
          new EngineNumber(new BigDecimal("25"), "kg"),
          new EngineNumber(new BigDecimal("200"), "tCO2e"), // domestic
          new EngineNumber(new BigDecimal("100"), "kg"),    // import - different units!
          new EngineNumber(new BigDecimal("50"), "tCO2e"),
          new EngineNumber(new BigDecimal("1000"), "units"),
          new EngineNumber(new BigDecimal("100"), "units"),
          new EngineNumber(new BigDecimal("300"), "tCO2e"),
          new EngineNumber(new BigDecimal("150"), "tCO2e"),
          new EngineNumber(new BigDecimal("500"), "kWh"),
          importSupplement
      );

      assertThrows(RuntimeException.class, result::getConsumptionNoRecycle);
    }
  }

  @Nested
  class EngineResultBuilderTests {

    /**
     * Helper method to create a complete EngineResultBuilder for testing.
     *
     * @return A complete EngineResultBuilder instance
     */
    private EngineResultBuilder createCompleteBuilder() {
      EngineResultBuilder builder = new EngineResultBuilder();
      ImportSupplement importSupplement = createSampleImportSupplement();

      builder.setApplication("test app");
      builder.setSubstance("test substance");
      builder.setYear(2023);
      builder.setManufactureValue(new EngineNumber(new BigDecimal("100"), "kg"));
      builder.setImportValue(new EngineNumber(new BigDecimal("50"), "kg"));
      builder.setRecycleValue(new EngineNumber(new BigDecimal("25"), "kg"));
      builder.setDomesticConsumptionValue(new EngineNumber(new BigDecimal("200"), "tCO2e"));
      builder.setImportConsumptionValue(new EngineNumber(new BigDecimal("100"), "tCO2e"));
      builder.setRecycleConsumptionValue(new EngineNumber(new BigDecimal("50"), "tCO2e"));
      builder.setPopulationValue(new EngineNumber(new BigDecimal("1000"), "units"));
      builder.setPopulationNew(new EngineNumber(new BigDecimal("100"), "units"));
      builder.setRechargeEmissions(new EngineNumber(new BigDecimal("300"), "tCO2e"));
      builder.setEolEmissions(new EngineNumber(new BigDecimal("150"), "tCO2e"));
      builder.setEnergyConsumption(new EngineNumber(new BigDecimal("500"), "kWh"));
      builder.setImportSupplement(importSupplement);

      return builder;
    }

    @Test
    void testInitializes() {
      EngineResultBuilder builder = new EngineResultBuilder();
      assertNotNull(builder);
    }

    @Test
    void testBuildsCompleteResult() {
      EngineResultBuilder builder = createCompleteBuilder();
      EngineResult result = builder.build();
      assertNotNull(result);
      assertEquals("test app", result.getApplication());
      assertEquals("test substance", result.getSubstance());
      assertEquals(2023, result.getYear());
    }

    @Test
    void testFailsOnEmptyResult() {
      EngineResultBuilder builder = new EngineResultBuilder();
      builder.setApplication("test app");
      // Missing required fields

      RuntimeException exception = assertThrows(RuntimeException.class, builder::build);
      assertTrue(exception.getMessage().contains("was not given"));
    }

    @Test
    void testFailsOnAlmostCompleteResult() {
      EngineResultBuilder builder = new EngineResultBuilder();
      ImportSupplement importSupplement = createSampleImportSupplement();

      builder.setApplication("test app");
      builder.setSubstance("test substance");
      builder.setYear(2023);
      builder.setManufactureValue(new EngineNumber(new BigDecimal("100"), "kg"));
      builder.setImportValue(new EngineNumber(new BigDecimal("50"), "kg"));
      builder.setRecycleValue(new EngineNumber(new BigDecimal("25"), "kg"));
      builder.setDomesticConsumptionValue(new EngineNumber(new BigDecimal("200"), "tCO2e"));
      builder.setImportConsumptionValue(new EngineNumber(new BigDecimal("100"), "tCO2e"));
      builder.setRecycleConsumptionValue(new EngineNumber(new BigDecimal("50"), "tCO2e"));
      builder.setPopulationValue(new EngineNumber(new BigDecimal("1000"), "units"));
      builder.setPopulationNew(new EngineNumber(new BigDecimal("100"), "units"));
      builder.setRechargeEmissions(new EngineNumber(new BigDecimal("300"), "tCO2e"));
      // Missing EOL emissions
      builder.setEnergyConsumption(new EngineNumber(new BigDecimal("500"), "kWh"));
      builder.setImportSupplement(importSupplement);

      RuntimeException exception = assertThrows(RuntimeException.class, builder::build);
      assertTrue(exception.getMessage().contains("eolEmissions"));
    }

    @Test
    void testFailsWhenMissingImportSupplement() {
      EngineResultBuilder builder = new EngineResultBuilder();

      builder.setApplication("test app");
      builder.setSubstance("test substance");
      builder.setYear(2023);
      builder.setManufactureValue(new EngineNumber(new BigDecimal("100"), "kg"));
      builder.setImportValue(new EngineNumber(new BigDecimal("50"), "kg"));
      builder.setRecycleValue(new EngineNumber(new BigDecimal("25"), "kg"));
      builder.setDomesticConsumptionValue(new EngineNumber(new BigDecimal("200"), "tCO2e"));
      builder.setImportConsumptionValue(new EngineNumber(new BigDecimal("100"), "tCO2e"));
      builder.setRecycleConsumptionValue(new EngineNumber(new BigDecimal("50"), "tCO2e"));
      builder.setPopulationValue(new EngineNumber(new BigDecimal("1000"), "units"));
      builder.setPopulationNew(new EngineNumber(new BigDecimal("100"), "units"));
      builder.setRechargeEmissions(new EngineNumber(new BigDecimal("300"), "tCO2e"));
      builder.setEolEmissions(new EngineNumber(new BigDecimal("150"), "tCO2e"));
      builder.setEnergyConsumption(new EngineNumber(new BigDecimal("500"), "kWh"));
      // Missing import supplement

      RuntimeException exception = assertThrows(RuntimeException.class, builder::build);
      assertTrue(exception.getMessage().contains("importSupplement"));
    }

    @Test
    void testMethodChaining() {
      ImportSupplement importSupplement = createSampleImportSupplement();

      EngineResult result = new EngineResultBuilder()
          .setApplication("test app")
          .setSubstance("test substance")
          .setYear(2023)
          .setManufactureValue(new EngineNumber(new BigDecimal("100"), "kg"))
          .setImportValue(new EngineNumber(new BigDecimal("50"), "kg"))
          .setRecycleValue(new EngineNumber(new BigDecimal("25"), "kg"))
          .setDomesticConsumptionValue(new EngineNumber(new BigDecimal("200"), "tCO2e"))
          .setImportConsumptionValue(new EngineNumber(new BigDecimal("100"), "tCO2e"))
          .setRecycleConsumptionValue(new EngineNumber(new BigDecimal("50"), "tCO2e"))
          .setPopulationValue(new EngineNumber(new BigDecimal("1000"), "units"))
          .setPopulationNew(new EngineNumber(new BigDecimal("100"), "units"))
          .setRechargeEmissions(new EngineNumber(new BigDecimal("300"), "tCO2e"))
          .setEolEmissions(new EngineNumber(new BigDecimal("150"), "tCO2e"))
          .setEnergyConsumption(new EngineNumber(new BigDecimal("500"), "kWh"))
          .setImportSupplement(importSupplement)
          .build();

      assertNotNull(result);
      assertEquals("test app", result.getApplication());
    }
  }
}