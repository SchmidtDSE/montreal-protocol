/**
 * Unit tests for engine unit state classes.
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.state;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.kigalisim.engine.Engine;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.number.UnitConverter;

/**
 * Unit tests for the ConverterStateGetter and OverridingConverterStateGetter classes.
 */
public class EngineUnitStateTest {

  /**
   * Mock inner StateGetter implementation for testing.
   */
  private static class MockInnerStateGetter implements StateGetter {
    private final Map<String, EngineNumber> values = new HashMap<>();

    public void setValue(String name, EngineNumber value) {
      values.put(name, value);
    }

    @Override
    public EngineNumber getSubstanceConsumption() {
      return values.getOrDefault("substanceConsumption", 
          new EngineNumber(BigDecimal.ONE, "tCO2e / kg"));
    }

    @Override
    public EngineNumber getEnergyIntensity() {
      return values.getOrDefault("energyIntensity", 
          new EngineNumber(BigDecimal.ONE, "kwh / kg"));
    }

    @Override
    public EngineNumber getAmortizedUnitVolume() {
      return values.getOrDefault("amortizedUnitVolume", 
          new EngineNumber(BigDecimal.ONE, "kg / unit"));
    }

    @Override
    public EngineNumber getPopulation() {
      return values.getOrDefault("population", new EngineNumber(BigDecimal.TEN, "units"));
    }

    @Override
    public EngineNumber getYearsElapsed() {
      return values.getOrDefault("yearsElapsed", new EngineNumber(BigDecimal.ONE, "year"));
    }

    @Override
    public EngineNumber getGhgConsumption() {
      return values.getOrDefault("ghgConsumption", new EngineNumber(BigDecimal.TEN, "tCO2e"));
    }

    @Override
    public EngineNumber getEnergyConsumption() {
      return values.getOrDefault("energyConsumption", 
          new EngineNumber(new BigDecimal("100"), "kwh"));
    }

    @Override
    public EngineNumber getVolume() {
      return values.getOrDefault("volume", new EngineNumber(new BigDecimal("50"), "kg"));
    }

    @Override
    public EngineNumber getAmortizedUnitConsumption() {
      return values.getOrDefault("amortizedUnitConsumption", 
          new EngineNumber(BigDecimal.ONE, "tCO2e / unit"));
    }

    @Override
    public EngineNumber getPopulationChange(UnitConverter unitConverter) {
      return values.getOrDefault("populationChange", 
          new EngineNumber(new BigDecimal("5"), "units"));
    }
  }

  @Test
  public void testConverterStateGetterInitializesWithEngine() {
    Engine engine = mock(Engine.class);
    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    assertNotNull(stateGetter);
  }

  @Test
  public void testConverterStateGetterGetSubstanceConsumption() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("2.5"), "tCO2e / kg");
    when(engine.getEqualsGhgIntensity()).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getSubstanceConsumption();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetEnergyIntensity() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("1.5"), "kwh / kg");
    when(engine.getEqualsEnergyIntensity()).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getEnergyIntensity();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetAmortizedUnitVolume() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(BigDecimal.TEN, "kg / unit");
    when(engine.getInitialCharge("sales")).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getAmortizedUnitVolume();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetPopulation() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("100"), "units");
    when(engine.getStream("equipment")).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getPopulation();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetYearsElapsed() {
    Engine engine = mock(Engine.class);
    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getYearsElapsed();

    assertEquals(0, BigDecimal.ONE.compareTo(result.getValue()));
    assertEquals("year", result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetGhgConsumption() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("50"), "tCO2e");
    when(engine.getStream("consumption")).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getGhgConsumption();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetEnergyConsumption() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("200"), "kwh");
    when(engine.getStream("energy")).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getEnergyConsumption();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testConverterStateGetterGetVolume() {
    Engine engine = mock(Engine.class);
    EngineNumber expected = new EngineNumber(new BigDecimal("75"), "kg");
    when(engine.getStream("sales")).thenReturn(expected);

    ConverterStateGetter stateGetter = new ConverterStateGetter(engine);
    EngineNumber result = stateGetter.getVolume();

    assertEquals(0, expected.getValue().compareTo(result.getValue()));
    assertEquals(expected.getUnits(), result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterInitializesWithInnerGetter() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    OverridingConverterStateGetter overriding = 
        new OverridingConverterStateGetter(inner);
    assertNotNull(overriding);
  }

  @Test
  public void testOverridingGetSubstanceConsumptionUsesInnerWhenNotOverridden() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("substanceConsumption", new EngineNumber(new BigDecimal("3"), "tCO2e / kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    EngineNumber result = overriding.getSubstanceConsumption();

    assertEquals(0, new BigDecimal("3").compareTo(result.getValue()));
    assertEquals("tCO2e / kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetSubstanceConsumptionOverridesInnerValue() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("substanceConsumption", new EngineNumber(new BigDecimal("3"), "tCO2e / kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setSubstanceConsumption(new EngineNumber(new BigDecimal("5"), "tCO2e / kg"));
    EngineNumber result = overriding.getSubstanceConsumption();

    assertEquals(0, new BigDecimal("5").compareTo(result.getValue()));
    assertEquals("tCO2e / kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterGetEnergyIntensityUsesInnerWhenNotOverridden() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("energyIntensity", new EngineNumber(new BigDecimal("2"), "kwh / kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    EngineNumber result = overriding.getEnergyIntensity();

    assertEquals(0, new BigDecimal("2").compareTo(result.getValue()));
    assertEquals("kwh / kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetEnergyIntensityOverridesInnerValue() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("energyIntensity", new EngineNumber(new BigDecimal("2"), "kwh / kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setEnergyIntensity(new EngineNumber(new BigDecimal("4"), "kwh / kg"));
    EngineNumber result = overriding.getEnergyIntensity();

    assertEquals(0, new BigDecimal("4").compareTo(result.getValue()));
    assertEquals("kwh / kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterGetPopulationUsesInnerWhenNotOverridden() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("population", new EngineNumber(new BigDecimal("20"), "units"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    EngineNumber result = overriding.getPopulation();

    assertEquals(0, new BigDecimal("20").compareTo(result.getValue()));
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetPopulationOverridesInnerValue() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("population", new EngineNumber(new BigDecimal("20"), "units"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setPopulation(new EngineNumber(new BigDecimal("30"), "units"));
    EngineNumber result = overriding.getPopulation();

    assertEquals(0, new BigDecimal("30").compareTo(result.getValue()));
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterGetVolumeUsesInnerWhenNotOverridden() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("volume", new EngineNumber(new BigDecimal("100"), "kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    EngineNumber result = overriding.getVolume();

    assertEquals(0, new BigDecimal("100").compareTo(result.getValue()));
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetVolumeOverridesInnerValue() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    inner.setValue("volume", new EngineNumber(new BigDecimal("100"), "kg"));
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setVolume(new EngineNumber(new BigDecimal("150"), "kg"));
    EngineNumber result = overriding.getVolume();

    assertEquals(0, new BigDecimal("150").compareTo(result.getValue()));
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetTotalWithSalesCallsSetVolume() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setTotal("sales", new EngineNumber(new BigDecimal("200"), "kg"));
    EngineNumber result = overriding.getVolume();

    assertEquals(0, new BigDecimal("200").compareTo(result.getValue()));
    assertEquals("kg", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetTotalWithEquipmentCallsSetPopulation() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setTotal("equipment", new EngineNumber(new BigDecimal("50"), "units"));
    EngineNumber result = overriding.getPopulation();

    assertEquals(0, new BigDecimal("50").compareTo(result.getValue()));
    assertEquals("units", result.getUnits());
  }

  @Test
  public void testOverridingConverterStateGetterSetTotalWithConsumptionCallsSetConsumption() {
    MockInnerStateGetter inner = new MockInnerStateGetter();
    OverridingConverterStateGetter overriding = new OverridingConverterStateGetter(inner);

    overriding.setTotal("consumption", new EngineNumber(new BigDecimal("75"), "tCO2e"));
    EngineNumber result = overriding.getGhgConsumption();

    assertEquals(0, new BigDecimal("75").compareTo(result.getValue()));
    assertEquals("tCO2e", result.getUnits());
  }
}