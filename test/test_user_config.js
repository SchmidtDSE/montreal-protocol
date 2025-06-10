/**
 * Unit tests for user configuration structures.
 *
 * @license BSD-3-Clause
 */

import {FilterSet} from "user_config";

function buildUserConfigTests() {
  QUnit.module("FilterSet", function () {
    const makeBasicExample = () => {
      return new FilterSet(
        2020,
        "bau",
        "commercial",
        "HFC-134a",
        "sales:import:mt / yr",
        "simulations",
        "baseline",
        true,
      );
    };

    const makeNullExample = () => {
      return new FilterSet(null, null, null, null, null, null, null, false);
    };

    QUnit.test("initializes with all parameters", function (assert) {
      const filterSet = makeBasicExample();
      assert.notDeepEqual(filterSet, undefined);
    });

    QUnit.test("initializes with null parameters", function (assert) {
      const filterSet = makeNullExample();
      assert.notDeepEqual(filterSet, undefined);
    });

    QUnit.test("getYear returns year", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getYear(), 2020);
    });

    QUnit.test("getYear returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getYear(), null);
    });

    QUnit.test("getScenario returns scenario", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getScenario(), "bau");
    });

    QUnit.test("getScenario returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getScenario(), null);
    });

    QUnit.test("getApplication returns application", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getApplication(), "commercial");
    });

    QUnit.test("getApplication returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getApplication(), null);
    });

    QUnit.test("getSubstance returns substance", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getSubstance(), "HFC-134a");
    });

    QUnit.test("getSubstance returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getSubstance(), null);
    });

    QUnit.test("getDimension returns dimension", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getDimension(), "simulations");
    });

    QUnit.test("getDimension returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getDimension(), null);
    });

    QUnit.test("getBaseline returns baseline", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getBaseline(), "baseline");
    });

    QUnit.test("getBaseline returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getBaseline(), null);
    });

    QUnit.test("getAttributeImporter returns attribute importer", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getAttributeImporter(), true);
    });

    QUnit.test("getAttributeImporter returns false when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.notOk(filterSet.getAttributeImporter());
    });

    QUnit.test("getFullMetricName returns full metric", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getFullMetricName(), "sales:import:mt / yr");
    });

    QUnit.test("getFullMetricName returns null when not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getFullMetricName(), null);
    });

    QUnit.test("getMetric parses metric family", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getMetric(), "sales");
    });

    QUnit.test("getMetric returns null when metric not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getMetric(), null);
    });

    QUnit.test("getSubMetric parses submetric", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getSubMetric(), "import");
    });

    QUnit.test("getSubMetric returns null when metric not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getSubMetric(), null);
    });

    QUnit.test("getSubMetric returns null when no submetric", function (assert) {
      const filterSet = new FilterSet(null, null, null, null, "sales", null, null, null);
      assert.deepEqual(filterSet.getSubMetric(), null);
    });

    QUnit.test("getUnits parses units", function (assert) {
      const filterSet = makeBasicExample();
      assert.deepEqual(filterSet.getUnits(), "mt / yr");
    });

    QUnit.test("getUnits returns null when metric not set", function (assert) {
      const filterSet = makeNullExample();
      assert.deepEqual(filterSet.getUnits(), null);
    });

    QUnit.test("getUnits returns null when no units", function (assert) {
      const filterSet = new FilterSet(null, null, null, null, "sales:import", null, null, null);
      assert.deepEqual(filterSet.getUnits(), null);
    });

    QUnit.test("getWithYear creates new instance with updated year", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithYear(2025);

      assert.deepEqual(newFilterSet.getYear(), 2025);
      assert.deepEqual(originalFilterSet.getYear(), 2020); // Original unchanged
      assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
      assert.deepEqual(newFilterSet.getApplication(), originalFilterSet.getApplication());
    });

    QUnit.test("getWithScenario creates new instance with updated scenario", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithScenario("newScenario");

      assert.deepEqual(newFilterSet.getScenario(), "newScenario");
      assert.deepEqual(originalFilterSet.getScenario(), "bau"); // Original unchanged
      assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
      assert.deepEqual(newFilterSet.getApplication(), originalFilterSet.getApplication());
    });

    QUnit.test(
      "getWithApplication creates new instance with updated application",
      function (assert) {
        const originalFilterSet = makeBasicExample();
        const newFilterSet = originalFilterSet.getWithApplication("industrial");

        assert.deepEqual(newFilterSet.getApplication(), "industrial");
        assert.deepEqual(originalFilterSet.getApplication(), "commercial"); // Original unchanged
        assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
        assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
      },
    );

    QUnit.test("getWithSubstance creates new instance with updated substance", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithSubstance("HFC-32");

      assert.deepEqual(newFilterSet.getSubstance(), "HFC-32");
      assert.deepEqual(originalFilterSet.getSubstance(), "HFC-134a"); // Original unchanged
      assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
      assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
    });

    QUnit.test("getWithMetric creates new instance with updated metric", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithMetric("emissions:all:tCO2e / yr");

      assert.deepEqual(newFilterSet.getFullMetricName(), "emissions:all:tCO2e / yr");
      assert.deepEqual(originalFilterSet.getFullMetricName(), "sales:import:mt / yr");
      assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
      assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
    });

    QUnit.test("getWithDimension creates new instance with updated dimension", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithDimension("applications");

      assert.deepEqual(newFilterSet.getDimension(), "applications");
      assert.deepEqual(originalFilterSet.getDimension(), "simulations"); // Original unchanged
      assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
      assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
    });

    QUnit.test("getWithBaseline creates new instance with updated baseline", function (assert) {
      const originalFilterSet = makeBasicExample();
      const newFilterSet = originalFilterSet.getWithBaseline("newBaseline");

      assert.deepEqual(newFilterSet.getBaseline(), "newBaseline");
      assert.deepEqual(originalFilterSet.getBaseline(), "baseline"); // Original unchanged
      assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
      assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
    });

    QUnit.test(
      "getWithAttributeImporter creates new instance with updated attribute importer",
      function (assert) {
        const originalFilterSet = makeBasicExample();
        const newFilterSet = originalFilterSet.getWithAttributeImporter(false);

        assert.deepEqual(newFilterSet.getAttributeImporter(), false);
        assert.deepEqual(originalFilterSet.getAttributeImporter(), true); // Original unchanged
        assert.deepEqual(newFilterSet.getYear(), originalFilterSet.getYear());
        assert.deepEqual(newFilterSet.getScenario(), originalFilterSet.getScenario());
      },
    );

    QUnit.test(
      "getWithDimensionValue updates scenario for simulations dimension",
      function (assert) {
        const originalFilterSet = new FilterSet(
          null,
          "oldScenario",
          null,
          null,
          null,
          "simulations",
          null,
          null,
        );
        const newFilterSet = originalFilterSet.getWithDimensionValue("newScenario");

        assert.deepEqual(newFilterSet.getScenario(), "newScenario");
        assert.deepEqual(originalFilterSet.getScenario(), "oldScenario"); // Original unchanged
      },
    );

    QUnit.test(
      "getWithDimensionValue updates application for applications dimension",
      function (assert) {
        const originalFilterSet = new FilterSet(
          null,
          null,
          "oldApp",
          null,
          null,
          "applications",
          null,
          null,
        );
        const newFilterSet = originalFilterSet.getWithDimensionValue("newApp");

        assert.deepEqual(newFilterSet.getApplication(), "newApp");
        assert.deepEqual(originalFilterSet.getApplication(), "oldApp"); // Original unchanged
      },
    );

    QUnit.test(
      "getWithDimensionValue updates substance for substances dimension",
      function (assert) {
        const originalFilterSet = new FilterSet(
          null,
          null,
          null,
          "oldSubstance",
          null,
          "substances",
          null,
          null,
        );
        const newFilterSet = originalFilterSet.getWithDimensionValue("newSubstance");

        assert.deepEqual(newFilterSet.getSubstance(), "newSubstance");
        assert.deepEqual(originalFilterSet.getSubstance(), "oldSubstance"); // Original unchanged
      },
    );

    QUnit.test("hasSingleScenario returns true when scenario is selected", function (assert) {
      const filterSet = new FilterSet(null, "selectedScenario", null, null, null, null, null, null);
      const scenarios = new Set(["scenario1", "scenario2", "scenario3"]);

      assert.ok(filterSet.hasSingleScenario(scenarios));
    });

    QUnit.test(
      "hasSingleScenario returns true when only one scenario available",
      function (assert) {
        const filterSet = new FilterSet(null, null, null, null, null, null, null, null);
        const scenarios = new Set(["onlyScenario"]);

        assert.ok(filterSet.hasSingleScenario(scenarios));
      },
    );

    QUnit.test(
      "hasSingleScenario returns false when no scenario selected and multiple available",
      function (assert) {
        const filterSet = new FilterSet(null, null, null, null, null, null, null, null);
        const scenarios = new Set(["scenario1", "scenario2", "scenario3"]);

        assert.notOk(filterSet.hasSingleScenario(scenarios));
      },
    );
  });
}

export {buildUserConfigTests};
