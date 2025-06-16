/**
 * Builder to help construct an EngineResult.
 *
 * <p>This class provides a builder pattern for constructing EngineResult instances,
 * ensuring all required fields are set before creating the result.</p>
 *
 * @license BSD-3-Clause
 */

package org.kigalisim.engine.serializer;

import org.kigalisim.engine.number.EngineNumber;

/**
 * Builder pattern implementation for creating EngineResult objects.
 *
 * <p>This builder ensures that all required fields are provided before
 * constructing an EngineResult instance.</p>
 */
public class EngineResultBuilder {
  private String application;
  private String substance;
  private Integer year;
  private EngineNumber manufactureValue;
  private EngineNumber importValue;
  private EngineNumber recycleValue;
  private EngineNumber domesticConsumptionValue;
  private EngineNumber importConsumptionValue;
  private EngineNumber recycleConsumptionValue;
  private EngineNumber populationValue;
  private EngineNumber populationNew;
  private EngineNumber rechargeEmissions;
  private EngineNumber eolEmissions;
  private EngineNumber energyConsumption;
  private ImportSupplement importSupplement;

  /**
   * Create builder without any values initialized.
   */
  public EngineResultBuilder() {
    // All fields initialized to null by default
  }

  /**
   * Set the application for which a result is being given.
   *
   * @param application The application name like "commercialRefrigeration"
   * @return This builder for method chaining
   */
  public EngineResultBuilder setApplication(String application) {
    this.application = application;
    return this;
  }

  /**
   * Set the substance for which a result is being given.
   *
   * @param substance The substance name like "HFC-134a"
   * @return This builder for method chaining
   */
  public EngineResultBuilder setSubstance(String substance) {
    this.substance = substance;
    return this;
  }

  /**
   * Set the year for which a result is being given.
   *
   * @param year The year for which the result is relevant
   * @return This builder for method chaining
   */
  public EngineResultBuilder setYear(int year) {
    this.year = year;
    return this;
  }

  /**
   * Set the manufacture value.
   *
   * @param manufactureValue The value associated with manufacturing in volume like kg
   * @return This builder for method chaining
   */
  public EngineResultBuilder setManufactureValue(EngineNumber manufactureValue) {
    this.manufactureValue = manufactureValue;
    return this;
  }

  /**
   * Set the import value.
   *
   * @param importValue The value related to imports like in volume like kg
   * @return This builder for method chaining
   */
  public EngineResultBuilder setImportValue(EngineNumber importValue) {
    this.importValue = importValue;
    return this;
  }

  /**
   * Set the recycle value.
   *
   * @param recycleValue The value denoting recycled materials in volume like kg
   * @return This builder for method chaining
   */
  public EngineResultBuilder setRecycleValue(EngineNumber recycleValue) {
    this.recycleValue = recycleValue;
    return this;
  }

  /**
   * Set the domestic consumption value.
   *
   * @param domesticConsumptionValue The domestic consumption value in tCO2e or equivalent
   * @return This builder for method chaining
   */
  public EngineResultBuilder setDomesticConsumptionValue(EngineNumber domesticConsumptionValue) {
    this.domesticConsumptionValue = domesticConsumptionValue;
    return this;
  }

  /**
   * Set the import consumption value.
   *
   * @param importConsumptionValue The import consumption value in tCO2e or equivalent
   * @return This builder for method chaining
   */
  public EngineResultBuilder setImportConsumptionValue(EngineNumber importConsumptionValue) {
    this.importConsumptionValue = importConsumptionValue;
    return this;
  }

  /**
   * Set the recycle consumption value.
   *
   * @param recycleConsumptionValue The recycle consumption value in tCO2e 
   *     or equivalent
   * @return This builder for method chaining
   */
  public EngineResultBuilder setRecycleConsumptionValue(EngineNumber recycleConsumptionValue) {
    this.recycleConsumptionValue = recycleConsumptionValue;
    return this;
  }

  /**
   * Set the population value.
   *
   * @param populationValue The population value in terms of equipment
   * @return This builder for method chaining
   */
  public EngineResultBuilder setPopulationValue(EngineNumber populationValue) {
    this.populationValue = populationValue;
    return this;
  }

  /**
   * Set the population new value.
   *
   * @param populationNew The amount of new equipment added this year
   * @return This builder for method chaining
   */
  public EngineResultBuilder setPopulationNew(EngineNumber populationNew) {
    this.populationNew = populationNew;
    return this;
  }

  /**
   * Set the recharge emissions value.
   *
   * @param rechargeEmissions The greenhouse gas emissions from recharge activities
   * @return This builder for method chaining
   */
  public EngineResultBuilder setRechargeEmissions(EngineNumber rechargeEmissions) {
    this.rechargeEmissions = rechargeEmissions;
    return this;
  }

  /**
   * Set the end-of-life emissions value.
   *
   * @param eolEmissions The greenhouse gas emissions from end-of-life equipment
   * @return This builder for method chaining
   */
  public EngineResultBuilder setEolEmissions(EngineNumber eolEmissions) {
    this.eolEmissions = eolEmissions;
    return this;
  }

  /**
   * Set the energy consumption value.
   *
   * @param energyConsumption The energy consumption value
   * @return This builder for method chaining
   */
  public EngineResultBuilder setEnergyConsumption(EngineNumber energyConsumption) {
    this.energyConsumption = energyConsumption;
    return this;
  }

  /**
   * Set the import supplement data.
   *
   * @param importSupplement Supplemental import information
   * @return This builder for method chaining
   */
  public EngineResultBuilder setImportSupplement(ImportSupplement importSupplement) {
    this.importSupplement = importSupplement;
    return this;
  }

  /**
   * Check that the builder is complete and create a new result.
   *
   * @return The result built from the values provided to this builder
   * @throws IllegalStateException if any required field is missing
   */
  public EngineResult build() {
    checkReadyToConstruct();
    return new EngineResult(
      application, substance, year, manufactureValue, importValue, recycleValue,
      domesticConsumptionValue, importConsumptionValue, recycleConsumptionValue,
      populationValue, populationNew, rechargeEmissions, eolEmissions,
      energyConsumption, importSupplement
    );
  }

  /**
   * Check that all required fields are set before construction.
   *
   * @throws IllegalStateException if any required field is missing
   */
  private void checkReadyToConstruct() {
    checkValid(application, "application");
    checkValid(substance, "substance");
    checkValid(year, "year");
    checkValid(manufactureValue, "manufactureValue");
    checkValid(importValue, "importValue");
    checkValid(recycleValue, "recycleValue");
    checkValid(domesticConsumptionValue, "domesticConsumptionValue");
    checkValid(importConsumptionValue, "importConsumptionValue");
    checkValid(recycleConsumptionValue, "recycleConsumptionValue");
    checkValid(populationValue, "populationValue");
    checkValid(populationNew, "populationNew");
    checkValid(rechargeEmissions, "rechargeEmissions");
    checkValid(eolEmissions, "eolEmissions");
    checkValid(energyConsumption, "energyConsumption");
    checkValid(importSupplement, "importSupplement");
  }

  /**
   * Check if a value is valid (not null).
   *
   * @param value The value to check
   * @param name The name of the field for error reporting
   * @throws IllegalStateException if the value is null
   */
  private void checkValid(Object value, String name) {
    if (value == null) {
      throw new IllegalStateException(
          "Could not make engine result because " + name + " was not given.");
    }
  }
}