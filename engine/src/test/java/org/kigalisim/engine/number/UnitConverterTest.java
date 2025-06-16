/**
 * Unit tests for the UnitConverter class.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.number;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/**
 * Tests for the UnitConverter class.
 */
public class UnitConverterTest {

  /**
   * Mock implementation of StateGetter for testing.
   */
  private static class MockStateGetter implements StateGetter {
    private EngineNumber substanceConsumption;
    private EngineNumber energyIntensity;
    private EngineNumber amortizedUnitVolume;
    private EngineNumber population;
    private EngineNumber yearsElapsed;
    private EngineNumber totalGhgConsumption;
    private EngineNumber volume;
    private EngineNumber amortizedUnitConsumption;
    private EngineNumber populationChange;
    private EngineNumber totalEnergyConsumption;

    public void setSubstanceConsumption(EngineNumber value) {
      this.substanceConsumption = value;
    }

    @Override
    public EngineNumber getSubstanceConsumption() {
      return substanceConsumption;
    }

    public void setEnergyIntensity(EngineNumber value) {
      this.energyIntensity = value;
    }

    @Override
    public EngineNumber getEnergyIntensity() {
      return energyIntensity;
    }

    public void setAmortizedUnitVolume(EngineNumber value) {
      this.amortizedUnitVolume = value;
    }

    @Override
    public EngineNumber getAmortizedUnitVolume() {
      return amortizedUnitVolume;
    }

    public void setPopulation(EngineNumber value) {
      this.population = value;
    }

    @Override
    public EngineNumber getPopulation() {
      return population;
    }

    public void setYearsElapsed(EngineNumber value) {
      this.yearsElapsed = value;
    }

    @Override
    public EngineNumber getYearsElapsed() {
      return yearsElapsed;
    }

    public void setGhgConsumption(EngineNumber value) {
      this.totalGhgConsumption = value;
    }

    @Override
    public EngineNumber getGhgConsumption() {
      return totalGhgConsumption;
    }

    public void setEnergyConsumption(EngineNumber value) {
      this.totalEnergyConsumption = value;
    }

    @Override
    public EngineNumber getEnergyConsumption() {
      return totalEnergyConsumption;
    }

    public void setVolume(EngineNumber value) {
      this.volume = value;
    }

    @Override
    public EngineNumber getVolume() {
      return volume;
    }

    public void setAmortizedUnitConsumption(EngineNumber value) {
      this.amortizedUnitConsumption = value;
    }

    @Override
    public EngineNumber getAmortizedUnitConsumption() {
      return amortizedUnitConsumption;
    }

    public void setPopulationChange(EngineNumber value) {
      this.populationChange = value;
    }

    @Override
    public EngineNumber getPopulationChange() {
      return populationChange;
    }
  }

  /**
   * Helper method to convert units using the UnitConverter.
   *
   * @param source The source EngineNumber
   * @param destination The destination units
   * @param stateGetter The state getter for conversion context
   * @return The converted EngineNumber
   */
  private EngineNumber convertUnits(EngineNumber source, String destination, 
      StateGetter stateGetter) {
    UnitConverter converter = new UnitConverter(stateGetter);
    return converter.convert(source, destination);
  }

  /**
   * Helper method to assert values are close within tolerance.
   *
   * @param expected The expected value
   * @param actual The actual value
   * @param tolerance The tolerance for comparison
   */
  private void assertCloseTo(double expected, BigDecimal actual, double tolerance) {
    double actualDouble = actual.doubleValue();
    assertEquals(expected, actualDouble, tolerance);
  }

  @Test
  public void testVolumeToVolume() {
    EngineNumber result = convertUnits(new EngineNumber(1, "mt"), "kg", new MockStateGetter());

    assertCloseTo(1000, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testConsumptionToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setSubstanceConsumption(new EngineNumber(5, "tCO2e / mt"));

    EngineNumber result = convertUnits(new EngineNumber(20, "tCO2e"), "mt", mockStateGetter);

    assertCloseTo(4, result.getValue(), 0.001);
    assertEquals("mt", result.getUnits());
  }

  @Test
  public void testUnitsToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setAmortizedUnitVolume(new EngineNumber(10, "kg / unit"));

    EngineNumber result = convertUnits(new EngineNumber(20, "units"), "kg", mockStateGetter);

    assertCloseTo(200, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testVolumePerPopToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulation(new EngineNumber(10, "units"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg / unit"), "kg", mockStateGetter);

    assertCloseTo(200, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testVolumePerPopToVolumePerPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulation(new EngineNumber(10, "units"));

    EngineNumber result = convertUnits(
        new EngineNumber(20, "kg / unit"), "mt / unit", mockStateGetter);

    assertCloseTo(20.0 / 1000, result.getValue(), 0.001);
    assertEquals("mt / unit", result.getUnits());
  }

  @Test
  public void testVolumePerTimeToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg / year"), "kg", mockStateGetter);

    assertCloseTo(40, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testVolumePerConsumptionToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setGhgConsumption(new EngineNumber(10, "tCO2e"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg / tCO2e"), "kg", mockStateGetter);

    assertCloseTo(200, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testVolumePerConsumptionToVolumeUsingEnergyConsumption() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyConsumption(new EngineNumber(10, "MJ"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg / kwh"), "kg", mockStateGetter);

    assertCloseTo(200, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testPercentToVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(20, "kg"));

    EngineNumber result = convertUnits(new EngineNumber(10, "%"), "kg", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testPopToPop() {
    EngineNumber result = convertUnits(
        new EngineNumber(5, "unit"), "units", new MockStateGetter());

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testVolumeToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setAmortizedUnitVolume(new EngineNumber(10, "kg / unit"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg"), "units", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testConsumptionToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setAmortizedUnitConsumption(new EngineNumber(50, "tCO2e / unit"));

    EngineNumber result = convertUnits(new EngineNumber(200, "tCO2e"), "units", mockStateGetter);

    assertCloseTo(4, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testPopPerTimeToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(
        new EngineNumber(20, "units / year"), "units", mockStateGetter);

    assertCloseTo(40, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testPopPerVolumeToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(10, "kg"));

    EngineNumber result = convertUnits(
        new EngineNumber(2, "units / kg"), "units", mockStateGetter);

    assertCloseTo(20, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testPopPerConsumptionToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setGhgConsumption(new EngineNumber(5, "tCO2e"));

    EngineNumber result = convertUnits(
        new EngineNumber(2, "units / tCO2e"), "units", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testPopPerConsumptionToPopUsingEnergyConsumption() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyConsumption(new EngineNumber(5, "kwh"));

    EngineNumber result = convertUnits(
        new EngineNumber(2, "units / kwh"), "units", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testPercentToPop() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulation(new EngineNumber(20, "units"));

    EngineNumber result = convertUnits(new EngineNumber(10, "%"), "units", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testConsumptionToConsumptionGhg() {
    EngineNumber result = convertUnits(
        new EngineNumber(5, "tCO2e"), "tCO2e", new MockStateGetter());

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testVolumeToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setSubstanceConsumption(new EngineNumber(5, "tCO2e / kg"));

    EngineNumber result = convertUnits(new EngineNumber(10, "kg"), "tCO2e", mockStateGetter);

    assertCloseTo(50, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testPopToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setSubstanceConsumption(new EngineNumber(0.1, "tCO2e / unit"));

    EngineNumber result = convertUnits(new EngineNumber(20, "units"), "tCO2e", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testConsumptionPerTimeToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(
        new EngineNumber(20, "tCO2e / year"), "tCO2e", mockStateGetter);

    assertCloseTo(40, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testConsumptionPerVolumeToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(5, "kg"));

    EngineNumber result = convertUnits(
        new EngineNumber(2, "tCO2e / kg"), "tCO2e", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testConsumptionPerPopToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulation(new EngineNumber(20, "units"));

    EngineNumber result = convertUnits(
        new EngineNumber(10, "tCO2e / unit"), "tCO2e", mockStateGetter);

    assertCloseTo(200, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testPercentToConsumptionForGhg() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setGhgConsumption(new EngineNumber(10, "tCO2e"));

    EngineNumber result = convertUnits(new EngineNumber(10, "%"), "tCO2e", mockStateGetter);

    assertCloseTo(1, result.getValue(), 0.001);
    assertEquals("tCO2e", result.getUnits());
  }

  @Test
  public void testPercentToConsumptionUsingEnergyConsumption() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyConsumption(new EngineNumber(10, "kwh"));

    EngineNumber result = convertUnits(new EngineNumber(10, "%"), "kwh", mockStateGetter);

    assertCloseTo(1, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testConsumptionToConsumptionEnergy() {
    EngineNumber result = convertUnits(new EngineNumber(5, "kwh"), "kwh", new MockStateGetter());

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testVolumeToConsumptionForEnergy() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyIntensity(new EngineNumber(5, "kwh / kg"));

    EngineNumber result = convertUnits(new EngineNumber(10, "kg"), "kwh", mockStateGetter);

    assertCloseTo(50, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testPopToConsumptionForEnergy() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyIntensity(new EngineNumber(0.1, "kwh / unit"));

    EngineNumber result = convertUnits(new EngineNumber(20, "units"), "kwh", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testConsumptionPerTimeToConsumptionForEnergy() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kwh / year"), "kwh", mockStateGetter);

    assertCloseTo(40, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testConsumptionPerVolumeToConsumptionForEnergy() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(5, "kg"));

    EngineNumber result = convertUnits(new EngineNumber(2, "kwh / kg"), "kwh", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("kwh", result.getUnits());
  }

  @Test
  public void testYearsToYears() {
    EngineNumber result = convertUnits(new EngineNumber(5, "year"), "years", new MockStateGetter());

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testConsumptionToYears() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setGhgConsumption(new EngineNumber(5, "tCO2e"));

    EngineNumber result = convertUnits(new EngineNumber(10, "tCO2e"), "years", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testConsumptionToYearsUsingEnergyConsumption() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setEnergyConsumption(new EngineNumber(5, "kwh"));

    EngineNumber result = convertUnits(new EngineNumber(10, "kwh"), "years", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testVolumeToYears() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(5, "kg"));

    EngineNumber result = convertUnits(new EngineNumber(10, "kg"), "years", mockStateGetter);

    assertCloseTo(2, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testPopToYears() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulationChange(new EngineNumber(2, "units"));

    EngineNumber result = convertUnits(new EngineNumber(20, "units"), "years", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testPercentToYears() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(new EngineNumber(10, "%"), "years", mockStateGetter);

    assertCloseTo(0.2, result.getValue(), 0.001);
    assertEquals("years", result.getUnits());
  }

  @Test
  public void testNormalizeByPopulation() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setPopulation(new EngineNumber(2, "units"));

    EngineNumber result = convertUnits(new EngineNumber(20, "kg"), "kg / unit", mockStateGetter);

    assertCloseTo(10, result.getValue(), 0.001);
    assertEquals("kg / unit", result.getUnits());
  }

  @Test
  public void testNormalizeByVolume() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setVolume(new EngineNumber(2, "kg"));

    EngineNumber result = convertUnits(new EngineNumber(10, "units"), "unit / kg", mockStateGetter);

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("unit / kg", result.getUnits());
  }

  @Test
  public void testNormalizeByGhgConsumption() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setGhgConsumption(new EngineNumber(2, "tCO2e"));

    EngineNumber result = convertUnits(
        new EngineNumber(10, "units"), "unit / tCO2e", mockStateGetter);

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("unit / tCO2e", result.getUnits());
  }

  @Test
  public void testNormalizeByTime() {
    MockStateGetter mockStateGetter = new MockStateGetter();
    mockStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

    EngineNumber result = convertUnits(
        new EngineNumber(10, "units"), "unit / year", mockStateGetter);

    assertCloseTo(5, result.getValue(), 0.001);
    assertEquals("unit / year", result.getUnits());
  }
}