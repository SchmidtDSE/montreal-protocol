function buildEngineNumberTests() {
  QUnit.module("EngineNumber", function () {
    const makeExample = () => {
      return new EngineNumber(1.23, "kg");
    };

    QUnit.test("initializes", function (assert) {
      const number = makeExample();
      assert.ok(number !== undefined);
    });

    QUnit.test("getValue", function (assert) {
      const number = makeExample();
      assert.ok(Math.abs(number.getValue() - 1.23) < 0.0001);
    });

    QUnit.test("getUnits", function (assert) {
      const number = makeExample();
      assert.ok(number.getUnits() === "kg");
    });
  });

  QUnit.module("convertUnits", function () {
    class MockConverterStateGetter {
      constructor() {
        const self = this;
        self._substanceEmissions = null;
        self._amortizedUnitVolume = null;
        self._population = null;
        self._yearsElapsed = null;
        self._totalEmissions = null;
        self._volume = null;
        self._amortizedUnitEmissions = null;
        self._populationChange = null;
      }

      setSubstanceEmissions(newValue) {
        const self = this;
        self._substanceEmissions = newValue;
      }

      getSubstanceEmissions() {
        const self = this;
        return self._substanceEmissions;
      }

      setAmortizedUnitVolume(newValue) {
        const self = this;
        self._amortizedUnitVolume = newValue;
      }

      getAmortizedUnitVolume() {
        const self = this;
        return self._amortizedUnitVolume;
      }

      setPopulation(newValue) {
        const self = this;
        self._population = newValue;
      }

      getPopulation() {
        const self = this;
        return self._population;
      }

      setYearsElapsed(newValue) {
        const self = this;
        self._yearsElapsed = newValue;
      }

      getYearsElapsed() {
        const self = this;
        return self._yearsElapsed;
      }

      setEmissions(newValue) {
        const self = this;
        self._totalEmissions = newValue;
      }

      getEmissions() {
        const self = this;
        return self._totalEmissions;
      }

      setVolume(newValue) {
        const self = this;
        self._volume = newValue;
      }

      getVolume() {
        const self = this;
        return self._volume;
      }

      setAmortizedUnitEmissions(newValue) {
        const self = this;
        self._amortizedUnitEmissions = newValue;
      }

      getAmortizedUnitEmissions() {
        const self = this;
        return self._amortizedUnitEmissions;
      }

      setPopulationChange(newValue) {
        const self = this;
        self._populationChange = newValue;
      }

      getPopulationChange() {
        const self = this;
        return self._populationChange;
      }
    }

    function convertUnits(source, destination, stateGetter) {
      const converter = new UnitConverter(stateGetter);
      return converter.convert(source, destination);
    }

    QUnit.test("volume to volume", function (assert) {
      const result = convertUnits(
        new EngineNumber(1, "mt"),
        "kg",
        new MockConverterStateGetter(),
      );

      assert.ok(Math.abs(result.getValue() - 1000) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("emissions to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setSubstanceEmissions(
        new EngineNumber(5, "tCO2e / mt"),
      );

      const result = convertUnits(
        new EngineNumber(20, "tCO2e"),
        "mt",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 4) < 0.001);
      assert.ok(result.getUnits() === "mt");
    });

    QUnit.test("units to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setAmortizedUnitVolume(
        new EngineNumber(10, "kg / unit"),
      );

      const result = convertUnits(
        new EngineNumber(20, "units"),
        "kg",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 200) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("volume per pop to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setPopulation(new EngineNumber(10, "units"));

      const result = convertUnits(
        new EngineNumber(20, "kg / unit"),
        "kg",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 200) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("volume per time to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

      const result = convertUnits(
        new EngineNumber(20, "kg / year"),
        "kg",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 40) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("volume per emissions to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setEmissions(new EngineNumber(10, "tCO2e"));

      const result = convertUnits(
        new EngineNumber(20, "kg / tCO2e"),
        "kg",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 200) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("percent to volume", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setVolume(new EngineNumber(20, "kg"));

      const result = convertUnits(
        new EngineNumber(10, "%"),
        "kg",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "kg");
    });

    QUnit.test("pop to pop", function (assert) {
      const result = convertUnits(
        new EngineNumber(5, "unit"),
        "units",
        new MockConverterStateGetter(),
      );

      assert.ok(Math.abs(result.getValue() - 5) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("volume to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setAmortizedUnitVolume(
        new EngineNumber(10, "kg / unit"),
      );

      const result = convertUnits(
        new EngineNumber(20, "kg"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("emissions to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setAmortizedUnitEmissions(
        new EngineNumber(50, "tCO2e / unit"),
      );

      const result = convertUnits(
        new EngineNumber(200, "tCO2e"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 4) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("pop per time to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

      const result = convertUnits(
        new EngineNumber(20, "units / year"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 40) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("pop per volume to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setVolume(new EngineNumber(10, "kg"));

      const result = convertUnits(
        new EngineNumber(2, "units / kg"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 20) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("pop per emissions to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setEmissions(new EngineNumber(5, "tCO2e"));

      const result = convertUnits(
        new EngineNumber(2, "units / tCO2e"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 10) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("percent to pop", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setPopulation(new EngineNumber(20, "units"));

      const result = convertUnits(
        new EngineNumber(10, "%"),
        "units",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "units");
    });

    QUnit.test("emissions to emissions", function (assert) {
      const result = convertUnits(
        new EngineNumber(5, "tCO2e"),
        "tCO2e",
        new MockConverterStateGetter(),
      );

      assert.ok(Math.abs(result.getValue() - 5) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("volume to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setSubstanceEmissions(
        new EngineNumber(5, "tCO2e / kg"),
      );

      const result = convertUnits(
        new EngineNumber(10, "kg"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 50) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("pop to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setAmortizedUnitVolume(
        new EngineNumber(0.1, "tCO2e / unit"),
      );

      const result = convertUnits(
        new EngineNumber(20, "units"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("emissions per time to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

      const result = convertUnits(
        new EngineNumber(20, "tCO2e / year"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 40) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("emissions per volume to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setVolume(new EngineNumber(5, "kg"));

      const result = convertUnits(
        new EngineNumber(2, "tCO2e / kg"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 10) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("emissions per pop to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setPopulation(new EngineNumber(20, "units"));

      const result = convertUnits(
        new EngineNumber(10, "tCO2e / unit"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 200) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("percent to emissions", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setEmissions(new EngineNumber(10, "tCO2e"));

      const result = convertUnits(
        new EngineNumber(10, "%"),
        "tCO2e",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 1) < 0.001);
      assert.ok(result.getUnits() === "tCO2e");
    });

    QUnit.test("years to years", function (assert) {
      const result = convertUnits(
        new EngineNumber(5, "year"),
        "years",
        new MockConverterStateGetter(),
      );

      assert.ok(Math.abs(result.getValue() - 5) < 0.001);
      assert.ok(result.getUnits() === "years");
    });

    QUnit.test("emissions to years", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setEmissions(new EngineNumber(5, "tCO2e"));

      const result = convertUnits(
        new EngineNumber(10, "tCO2e"),
        "years",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "years");
    });

    QUnit.test("volume to years", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setVolume(new EngineNumber(5, "kg"));

      const result = convertUnits(
        new EngineNumber(10, "kg"),
        "years",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 2) < 0.001);
      assert.ok(result.getUnits() === "years");
    });

    QUnit.test("pop to years", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setPopulationChange(
        new EngineNumber(2, "units"),
      );

      const result = convertUnits(
        new EngineNumber(20, "units"),
        "years",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 10) < 0.001);
      assert.ok(result.getUnits() === "years");
    });

    QUnit.test("percent to years", function (assert) {
      const mockConverterStateGetter = new MockConverterStateGetter();
      mockConverterStateGetter.setYearsElapsed(new EngineNumber(2, "years"));

      const result = convertUnits(
        new EngineNumber(10, "%"),
        "years",
        mockConverterStateGetter,
      );

      assert.ok(Math.abs(result.getValue() - 0.2) < 0.001);
      assert.ok(result.getUnits() === "years");
    });
  });
}

exports {buildEngineNumberTests};
