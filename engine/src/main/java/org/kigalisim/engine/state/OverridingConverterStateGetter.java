/**
 * State getter that allows overriding values from an inner state getter.
 *
 * <p>This class wraps an inner StateGetter and allows individual values to be
 * overridden while delegating to the inner getter for non-overridden values.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.state;

import java.util.HashMap;
import java.util.Map;
import org.kigalisim.engine.number.EngineNumber;
import org.kigalisim.engine.number.UnitConverter;

/**
 * State getter that allows overriding values from an inner state getter.
 *
 * <p>This class wraps an inner StateGetter and allows individual values to be
 * overridden while delegating to the inner getter for non-overridden values.</p>
 */
public class OverridingConverterStateGetter implements StateGetter {

  private final StateGetter innerGetter;
  private EngineNumber energyIntensity;
  private EngineNumber amortizedUnitVolume;
  private EngineNumber population;
  private EngineNumber yearsElapsed;
  private EngineNumber totalConsumption;
  private EngineNumber energyConsumption;
  private EngineNumber volume;
  private EngineNumber amortizedUnitConsumption;
  private EngineNumber populationChange;
  private EngineNumber substanceConsumption;

  /**
   * Create a new overriding converter state getter.
   *
   * @param innerGetter The base state getter to wrap
   */
  public OverridingConverterStateGetter(StateGetter innerGetter) {
    this.innerGetter = innerGetter;
  }

  /**
   * Set total values for different stream types.
   *
   * @param streamName The name of the stream (sales, manufacture, import, etc.)
   * @param value The value to set for the stream
   */
  public void setTotal(String streamName, EngineNumber value) {
    switch (streamName) {
      case "sales":
      case "manufacture":
      case "import":
        setVolume(value);
        break;
      case "equipment":
      case "priorEquipment":
        setPopulation(value);
        break;
      case "consumption":
        setConsumption(value);
        break;
      default:
        // No-op for unrecognized stream names
        break;
    }
  }

  /**
   * Set the substance consumption value.
   *
   * @param newValue The new substance consumption value
   */
  public void setSubstanceConsumption(EngineNumber newValue) {
    this.substanceConsumption = newValue;
  }

  /**
   * Get the substance consumption value.
   *
   * @return The substance consumption value
   */
  @Override
  public EngineNumber getSubstanceConsumption() {
    return substanceConsumption != null 
        ? substanceConsumption : innerGetter.getSubstanceConsumption();
  }

  /**
   * Set the energy intensity value.
   *
   * @param newValue The new energy intensity value
   */
  public void setEnergyIntensity(EngineNumber newValue) {
    this.energyIntensity = newValue;
  }

  /**
   * Get the energy intensity value.
   *
   * @return The energy intensity value
   */
  @Override
  public EngineNumber getEnergyIntensity() {
    return energyIntensity != null ? energyIntensity : innerGetter.getEnergyIntensity();
  }

  /**
   * Set the amortized unit volume value.
   *
   * @param newValue The new amortized unit volume value
   */
  public void setAmortizedUnitVolume(EngineNumber newValue) {
    this.amortizedUnitVolume = newValue;
  }

  /**
   * Get the amortized unit volume value.
   *
   * @return The amortized unit volume value
   */
  @Override
  public EngineNumber getAmortizedUnitVolume() {
    return amortizedUnitVolume != null ? amortizedUnitVolume : innerGetter.getAmortizedUnitVolume();
  }

  /**
   * Set the population value.
   *
   * @param newValue The new population value
   */
  public void setPopulation(EngineNumber newValue) {
    this.population = newValue;
  }

  /**
   * Get the population value.
   *
   * @return The population value
   */
  @Override
  public EngineNumber getPopulation() {
    return population != null ? population : innerGetter.getPopulation();
  }

  /**
   * Set the years elapsed value.
   *
   * @param newValue The new years elapsed value
   */
  public void setYearsElapsed(EngineNumber newValue) {
    this.yearsElapsed = newValue;
  }

  /**
   * Get the years elapsed value.
   *
   * @return The years elapsed value
   */
  @Override
  public EngineNumber getYearsElapsed() {
    return yearsElapsed != null ? yearsElapsed : innerGetter.getYearsElapsed();
  }

  /**
   * Set the consumption value.
   *
   * @param newValue The new consumption value
   */
  public void setConsumption(EngineNumber newValue) {
    this.totalConsumption = newValue;
  }

  /**
   * Set the energy consumption equivalency.
   *
   * @param newValue The new energy consumption value
   */
  public void setEnergyConsumption(EngineNumber newValue) {
    this.energyConsumption = newValue;
  }

  /**
   * Get the GHG consumption value.
   *
   * @return The GHG consumption value
   */
  @Override
  public EngineNumber getGhgConsumption() {
    return totalConsumption != null ? totalConsumption : innerGetter.getGhgConsumption();
  }

  /**
   * Get the energy consumption value.
   *
   * @return The energy consumption value
   */
  @Override
  public EngineNumber getEnergyConsumption() {
    return energyConsumption != null ? energyConsumption : innerGetter.getEnergyConsumption();
  }

  /**
   * Set the volume value.
   *
   * @param newValue The new volume value
   */
  public void setVolume(EngineNumber newValue) {
    this.volume = newValue;
  }

  /**
   * Get the volume value.
   *
   * @return The volume value
   */
  @Override
  public EngineNumber getVolume() {
    return volume != null ? volume : innerGetter.getVolume();
  }

  /**
   * Set the amortized unit consumption value.
   *
   * @param newValue The new amortized unit consumption value
   */
  public void setAmortizedUnitConsumption(EngineNumber newValue) {
    this.amortizedUnitConsumption = newValue;
  }

  /**
   * Get the amortized unit consumption value.
   *
   * @return The amortized unit consumption value
   */
  @Override
  public EngineNumber getAmortizedUnitConsumption() {
    return amortizedUnitConsumption != null 
        ? amortizedUnitConsumption : innerGetter.getAmortizedUnitConsumption();
  }

  /**
   * Set the population change value.
   *
   * @param newValue The new population change value
   */
  public void setPopulationChange(EngineNumber newValue) {
    this.populationChange = newValue;
  }

  /**
   * Get the population change value.
   *
   * @param unitConverter Converter for ensuring consistent units
   * @return The population change value
   */
  @Override
  public EngineNumber getPopulationChange(UnitConverter unitConverter) {
    return populationChange != null 
        ? populationChange : innerGetter.getPopulationChange(unitConverter);
  }
}
