import {EngineNumber} from "engine_number";

import {Scope, YearMatcher} from "engine_state";

import {Engine} from "engine";

function buildEngineTests() {
  QUnit.module("Engine", function () {
    QUnit.test("initializes", function (assert) {
      const engine = new Engine(1, 30);
      assert.notDeepEqual(engine, undefined);
    });

    QUnit.test("gets years", function (assert) {
      const engine = new Engine(1, 30);
      assert.equal(engine.getStartYear(), 1);
      assert.equal(engine.getEndYear(), 30);
    });

    QUnit.test("gets years reverse", function (assert) {
      const engine = new Engine(30, 1);
      assert.equal(engine.getStartYear(), 1);
      assert.equal(engine.getEndYear(), 30);
    });

    QUnit.test("changes scope", function (assert) {
      const engine = new Engine(1, 30);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      const scopeOldRet = engine.getScope();
      assert.deepEqual(scopeOldRet.getStanza(), "default");
      assert.deepEqual(scopeOldRet.getApplication(), "test app");
      assert.deepEqual(scopeOldRet.getSubstance(), "test substance");

      engine.setSubstance("test substance 2");

      const scopeNewRet = engine.getScope();
      assert.deepEqual(scopeNewRet.getStanza(), "default");
      assert.deepEqual(scopeNewRet.getApplication(), "test app");
      assert.deepEqual(scopeNewRet.getSubstance(), "test substance 2");
    });

    QUnit.test("increments year", function (assert) {
      const engine = new Engine(1, 2);
      assert.equal(engine.getYear(), 1);
      assert.ok(!engine.getIsDone());

      engine.incrementYear();
      assert.equal(engine.getYear(), 2);
      assert.ok(!engine.getIsDone());

      engine.incrementYear();
      assert.equal(engine.getYear(), 3);
      assert.ok(engine.getIsDone());
    });

    QUnit.test("set stream", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(1, "kg"), new YearMatcher(null, null));

      engine.setStream("import", new EngineNumber(2, "kg"), new YearMatcher(null, null));

      engine.setStream("sales", new EngineNumber(30, "kg"), new YearMatcher(null, null));

      const manufactureVal = engine.getStream("manufacture");
      assert.closeTo(manufactureVal.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal.getUnits(), "kg");

      const importVal = engine.getStream("import");
      assert.closeTo(importVal.getValue(), 20, 0.0001);
      assert.deepEqual(importVal.getUnits(), "kg");
    });

    QUnit.test("set percentage", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(100, "mt"), new YearMatcher(1, 1));
      engine.setStream("manufacture", new EngineNumber(75, "%"), new YearMatcher(2, 2));
      engine.incrementYear();
      engine.setStream("manufacture", new EngineNumber(75, "%"), new YearMatcher(2, 2));

      const salesVal = engine.getStream("manufacture");
      assert.closeTo(salesVal.getValue(), 75000, 0.0001);
      assert.deepEqual(salesVal.getUnits(), "kg");
    });

    QUnit.test("checks year", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(1, "kg"), new YearMatcher(null, null));

      engine.setStream("manufacture", new EngineNumber(2, "kg"), new YearMatcher(1, null));

      engine.setStream("manufacture", new EngineNumber(3, "kg"), new YearMatcher(2, null));

      const manufactureVal = engine.getStream("manufacture");
      assert.equal(manufactureVal.getValue(), 2);
      assert.deepEqual(manufactureVal.getUnits(), "kg");
    });

    QUnit.test("applies limit in specific year", function (assert) {
      const engine = new Engine(1, 2);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(100, "kg"), new YearMatcher(1, 1));
      engine.cap("manufacturing", new EngineNumber(75, "kg"), new YearMatcher(2, 2));

      const salesVal1 = engine.getStream("manufacture");
      assert.closeTo(salesVal1.getValue(), 100, 0.0001);
      assert.deepEqual(salesVal1.getUnits(), "kg");

      engine.incrementYear();

      engine.cap("manufacture", new EngineNumber(75, "kg"), new YearMatcher(2, 2));

      const salesVal2 = engine.getStream("manufacture");
      assert.closeTo(salesVal2.getValue(), 75, 0.0001);
      assert.deepEqual(salesVal2.getUnits(), "kg");
    });

    QUnit.test("determines populations", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(2, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("equipment");
      assert.equal(manufactureVal1.getValue(), 5);
      assert.deepEqual(manufactureVal1.getUnits(), "units");
    });

    QUnit.test("determines basic consumption", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setInitialCharge(
        new EngineNumber(123, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.equals(new EngineNumber(1, "tCO2e / kg"), new YearMatcher(null, null));

      engine.setStream("manufacture", new EngineNumber(2, "units"), new YearMatcher(null, null));

      const consumption = engine.getStream("consumption");
      assert.closeTo(consumption.getValue(), 246, 0.0001);
      assert.deepEqual(consumption.getUnits(), "tCO2e");
    });

    QUnit.test("change stream", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(2, null),
      );

      const count1 = engine.getStream("manufacture");
      assert.equal(count1.getValue(), 10);
      assert.deepEqual(count1.getUnits(), "kg");

      engine.incrementYear();

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count2 = engine.getStream("manufacture");
      assert.equal(count2.getValue(), 11);
      assert.deepEqual(count2.getUnits(), "kg");

      engine.incrementYear();

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count3 = engine.getStream("manufacture");
      assert.equal(count3.getValue(), 12.1);
      assert.deepEqual(count3.getUnits(), "kg");
    });

    QUnit.test("change stream alternative notation", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.changeStream("manufacture", new EngineNumber(10, "%"), new YearMatcher(2, null));

      const count1 = engine.getStream("manufacture");
      assert.equal(count1.getValue(), 10);
      assert.deepEqual(count1.getUnits(), "kg");

      engine.incrementYear();

      engine.changeStream("manufacture", new EngineNumber(10, "%"), new YearMatcher(null, null));

      const count2 = engine.getStream("manufacture");
      assert.equal(count2.getValue(), 11);
      assert.deepEqual(count2.getUnits(), "kg");

      engine.incrementYear();

      engine.changeStream("manufacture", new EngineNumber(10, "%"), new YearMatcher(null, null));

      const count3 = engine.getStream("manufacture");
      assert.equal(count3.getValue(), 12.1);
      assert.deepEqual(count3.getUnits(), "kg");
    });

    QUnit.test("manages parallel stream", function (assert) {
      const engine = new Engine(1, 3);

      const scope1 = new Scope("default", "test app", "sub 1");

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 1");

      engine.setStream("manufacture", new EngineNumber(1, "kg"), new YearMatcher(null, null));

      const manufacture1ValDirect = engine.getStream("manufacture");
      assert.equal(manufacture1ValDirect.getValue(), 1);
      assert.deepEqual(manufacture1ValDirect.getUnits(), "kg");

      const manufacture1ValIndirect = engine.getStream("manufacture");
      assert.equal(manufacture1ValIndirect.getValue(), 1);
      assert.deepEqual(manufacture1ValIndirect.getUnits(), "kg");

      engine.setSubstance("sub 2");

      engine.setStream("manufacture", new EngineNumber(2, "kg"), new YearMatcher(null, null));

      const manufacture2ValDirect = engine.getStream("manufacture");
      assert.equal(manufacture2ValDirect.getValue(), 2);
      assert.deepEqual(manufacture2ValDirect.getUnits(), "kg");

      const manufacture2ValIndirect = engine.getStream("manufacture");
      assert.equal(manufacture2ValIndirect.getValue(), 2);
      assert.deepEqual(manufacture2ValIndirect.getUnits(), "kg");

      const manufactureValParallel = engine.getStream("manufacture", scope1);
      assert.equal(manufactureValParallel.getValue(), 1);
      assert.deepEqual(manufactureValParallel.getUnits(), "kg");
    });

    QUnit.test("manages variables", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");

      engine.defineVariable("testVar");
      engine.setVariable("testVar", 123);
      assert.equal(engine.getVariable("testVar"), 123);

      engine.setSubstance("sub 1");
      engine.setVariable("testVar", 124);
      assert.equal(engine.getVariable("testVar"), 124);

      engine.setSubstance("sub 2");
      engine.defineVariable("testVar");
      engine.setVariable("testVar", 125);
      assert.equal(engine.getVariable("testVar"), 125);

      engine.setSubstance("sub 3");
      assert.equal(engine.getVariable("testVar"), 124);
    });

    QUnit.test("applies caps", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null));

      engine.cap("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      const firstCapVal = engine.getStream("manufacture");
      assert.closeTo(firstCapVal.getValue(), 10, 0.0001);
      assert.deepEqual(firstCapVal.getUnits(), "kg");

      engine.cap("manufacture", new EngineNumber(50, "%"), new YearMatcher(null, null));

      const secondCapVal = engine.getStream("manufacture");
      assert.closeTo(secondCapVal.getValue(), 5, 0.0001);
      assert.deepEqual(secondCapVal.getUnits(), "kg");
    });

    QUnit.test("applies cap displace stream", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream("manufacture", new EngineNumber(20, "kg"), new YearMatcher(null, null));

      engine.setStream("import", new EngineNumber(5, "kg"), new YearMatcher(null, null));

      engine.cap("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null), "import");

      const capVal = engine.getStream("manufacture");
      assert.closeTo(capVal.getValue(), 15, 0.0001);
      assert.deepEqual(capVal.getUnits(), "kg");

      const displaceVal = engine.getStream("import");
      assert.closeTo(displaceVal.getValue(), 10, 0.0001);
      assert.deepEqual(displaceVal.getUnits(), "kg");
    });

    QUnit.test("applies cap displace substance", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");

      engine.setSubstance("sub1");

      engine.setStream("manufacture", new EngineNumber(5, "kg"), new YearMatcher(null, null));

      engine.setSubstance("sub2");

      engine.setStream("manufacture", new EngineNumber(20, "kg"), new YearMatcher(null, null));

      engine.cap("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null), "sub1");

      const floorVal = engine.getStream("manufacture");
      assert.closeTo(floorVal.getValue(), 15, 0.0001);
      assert.deepEqual(floorVal.getUnits(), "kg");

      engine.setSubstance("sub1");

      const displaceVal = engine.getStream("manufacture");
      assert.closeTo(displaceVal.getValue(), 10, 0.0001);
      assert.deepEqual(displaceVal.getUnits(), "kg");
    });

    QUnit.test("applies floor", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null));

      engine.floor("manufacture", new EngineNumber(20, "kg"), new YearMatcher(null, null));

      const floorVal = engine.getStream("manufacture");
      assert.closeTo(floorVal.getValue(), 20, 0.0001);
      assert.deepEqual(floorVal.getUnits(), "kg");
    });

    QUnit.test("applies floor displace stream", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null));

      engine.setStream("import", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.floor(
        "manufacture",
        new EngineNumber(20, "kg"),
        new YearMatcher(null, null),
        "import",
      );

      const floorVal = engine.getStream("manufacture");
      assert.closeTo(floorVal.getValue(), 20, 0.0001);
      assert.deepEqual(floorVal.getUnits(), "kg");

      const displaceVal = engine.getStream("import");
      assert.closeTo(displaceVal.getValue(), 5, 0.0001);
      assert.deepEqual(displaceVal.getUnits(), "kg");
    });

    QUnit.test("applies floor displace substance", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");

      engine.setSubstance("sub1");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setSubstance("sub2");

      engine.setStream("manufacture", new EngineNumber(15, "kg"), new YearMatcher(null, null));

      engine.floor("manufacture", new EngineNumber(20, "kg"), new YearMatcher(null, null), "sub1");

      const floorVal = engine.getStream("manufacture");
      assert.closeTo(floorVal.getValue(), 20, 0.0001);
      assert.deepEqual(floorVal.getUnits(), "kg");

      engine.setSubstance("sub1");

      const displaceVal = engine.getStream("manufacture");
      assert.closeTo(displaceVal.getValue(), 5, 0.0001);
      assert.deepEqual(displaceVal.getUnits(), "kg");
    });

    QUnit.test("sets energy intensity", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.equals(new EngineNumber(100, "kwh / kg"), new YearMatcher(null, null));

      const consumptionRaw = engine._streamKeeper.getEnergyIntensity("test app", "test substance");
      assert.closeTo(consumptionRaw.getValue(), 100, 0.0001);
      assert.deepEqual(consumptionRaw.getUnits(), "kwh / kg");
    });

    QUnit.test("replaces substances", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 1");

      engine.setStream("manufacture", new EngineNumber(5, "kg"), new YearMatcher(null, null));

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 2");

      engine.setStream("manufacture", new EngineNumber(5, "kg"), new YearMatcher(null, null));

      engine.replace(
        new EngineNumber(2, "kg"),
        "manufacture",
        "sub 1",
        new YearMatcher(null, null),
      );

      engine.setSubstance("sub 1");
      const sub1Manufacture = engine.getStream("manufacture");
      assert.closeTo(sub1Manufacture.getValue(), 7, 0.0001);
      assert.deepEqual(sub1Manufacture.getUnits(), "kg");

      engine.setSubstance("sub 2");
      const sub2Manufacture = engine.getStream("manufacture");
      assert.closeTo(sub2Manufacture.getValue(), 3, 0.0001);
      assert.deepEqual(sub2Manufacture.getUnits(), "kg");
    });

    QUnit.test("different initial charges", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setInitialCharge(
        new EngineNumber(5, "kg / unit"),
        "manufacture",
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(10, "kg / unit"),
        "import",
        new YearMatcher(null, null),
      );

      engine.setStream("manufacture", new EngineNumber(25, "kg"), new YearMatcher(null, null));

      engine.setStream("import", new EngineNumber(20, "kg"), new YearMatcher(null, null));

      const population = engine.getStream("equipment");
      assert.closeTo(population.getValue(), 7, 0.0001);
      assert.deepEqual(population.getUnits(), "units");
    });

    QUnit.test("different initial charges with intervention", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setInitialCharge(
        new EngineNumber(5, "kg / unit"),
        "manufacture",
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(10, "kg / unit"),
        "import",
        new YearMatcher(null, null),
      );

      engine.setStream("manufacture", new EngineNumber(25, "kg"), new YearMatcher(null, null));

      engine.setStream("import", new EngineNumber(20, "kg"), new YearMatcher(null, null));

      engine.cap("import", new EngineNumber(50, "%"), new YearMatcher(null, null));

      const population = engine.getStream("equipment");
      assert.closeTo(population.getValue(), 6, 0.0001);
      assert.deepEqual(population.getUnits(), "units");
    });

    QUnit.test("retires equipment in first year", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.retire(new EngineNumber(10, "% / year"), new YearMatcher(null, null));

      const manufactureVal1 = engine.getStream("equipment");
      assert.closeTo(manufactureVal1.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "units");

      engine.incrementYear();

      const manufactureVal2 = engine.getStream("equipment");
      assert.closeTo(manufactureVal2.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal2.getUnits(), "units");
    });

    QUnit.test("retires equipment in multiple years", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      const executeLogic = () => {
        engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

        engine.setInitialCharge(
          new EngineNumber(1, "kg / unit"),
          "sales",
          new YearMatcher(null, null),
        );

        engine.retire(new EngineNumber(10, "% / year"), new YearMatcher(null, null));
      };

      executeLogic();

      const manufactureVal1 = engine.getStream("equipment");
      assert.equal(manufactureVal1.getValue(), 10);
      assert.deepEqual(manufactureVal1.getUnits(), "units");

      engine.incrementYear();
      executeLogic();

      const manufactureVal2 = engine.getStream("equipment");
      assert.equal(manufactureVal2.getValue(), 19);
      assert.deepEqual(manufactureVal2.getUnits(), "units");
    });

    QUnit.test("recharges in first year", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(10, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      const equipmentVal1 = engine.getStream("equipment");
      assert.closeTo(equipmentVal1.getValue(), 10, 0.0001);
      assert.deepEqual(equipmentVal1.getUnits(), "units");

      const salesVal1 = engine.getStream("sales");
      assert.closeTo(salesVal1.getValue(), 10, 0.0001);
      assert.deepEqual(salesVal1.getUnits(), "kg");

      engine.incrementYear();

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      const equipmentVal2 = engine.getStream("equipment");
      assert.closeTo(equipmentVal2.getValue(), 20, 0.0001);
      assert.deepEqual(equipmentVal2.getUnits(), "units");
    });

    QUnit.test("recharges in multiple years", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(10, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      const equipmentVal1 = engine.getStream("equipment");
      assert.closeTo(equipmentVal1.getValue(), 10, 0.0001);
      assert.deepEqual(equipmentVal1.getUnits(), "units");

      const salesVal1 = engine.getStream("sales");
      assert.closeTo(salesVal1.getValue(), 10, 0.0001);
      assert.deepEqual(salesVal1.getUnits(), "kg");

      engine.incrementYear();

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(10, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      const equipmentVal2 = engine.getStream("equipment");
      assert.closeTo(equipmentVal2.getValue(), 19, 0.0001);
      assert.deepEqual(equipmentVal2.getUnits(), "units");

      const salesVal2 = engine.getStream("sales");
      assert.closeTo(salesVal2.getValue(), 10, 0.0001);
      assert.deepEqual(salesVal2.getUnits(), "kg");
    });

    QUnit.test("recycles with no displacement", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(0, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal1.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "kg");

      const equipmentVal1 = engine.getStream("equipment");
      assert.closeTo(equipmentVal1.getValue(), 10, 0.0001);
      assert.deepEqual(equipmentVal1.getUnits(), "units");

      engine.incrementYear();

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(0, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal2.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal2.getUnits(), "kg");

      const equipmentVal2 = engine.getStream("equipment");
      assert.closeTo(equipmentVal2.getValue(), 15, 0.0001);
      assert.deepEqual(equipmentVal2.getUnits(), "units");
    });

    QUnit.test("recycles with full displacement", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(100, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal1.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "kg");

      const recycleVal1 = engine.getStream("recycle");
      assert.closeTo(recycleVal1.getValue(), 0, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "kg");

      const equipmentVal1 = engine.getStream("equipment");
      assert.closeTo(equipmentVal1.getValue(), 10, 0.0001);
      assert.deepEqual(equipmentVal1.getUnits(), "units");

      engine.incrementYear();

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(100, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal2.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal2.getUnits(), "kg");

      const recycleVal2 = engine.getStream("recycle");
      assert.closeTo(recycleVal2.getValue(), 2.5, 0.0001);
      assert.deepEqual(recycleVal2.getUnits(), "kg");

      const equipmentVal2 = engine.getStream("equipment");
      assert.closeTo(equipmentVal2.getValue(), 15, 0.0001);
      assert.deepEqual(equipmentVal2.getUnits(), "units");
    });

    QUnit.test("recycles with half displacement", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(50, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal1.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "kg");

      const equipmentVal1 = engine.getStream("equipment");
      assert.closeTo(equipmentVal1.getValue(), 10, 0.0001);
      assert.deepEqual(equipmentVal1.getUnits(), "units");

      engine.incrementYear();

      engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.recharge(
        new EngineNumber(50, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.recycle(
        new EngineNumber(50, "%"),
        new EngineNumber(100, "%"),
        new EngineNumber(50, "%"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal2.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal2.getUnits(), "kg");

      const recycleVal2 = engine.getStream("recycle");
      assert.closeTo(recycleVal2.getValue(), 1.25, 0.0001);
      assert.deepEqual(recycleVal2.getUnits(), "kg");

      const equipmentVal2 = engine.getStream("equipment");
      assert.closeTo(equipmentVal2.getValue(), 15, 0.0001);
      assert.deepEqual(equipmentVal2.getUnits(), "units");
    });

    QUnit.test("combine retire and recharge", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      const executeLogic = () => {
        engine.setStream("manufacture", new EngineNumber(10, "kg"), new YearMatcher(null, null));

        engine.setInitialCharge(
          new EngineNumber(1, "kg / unit"),
          "sales",
          new YearMatcher(null, null),
        );

        engine.retire(new EngineNumber(10, "% / year"), new YearMatcher(null, null));

        engine.recharge(
          new EngineNumber(10, "% / year"),
          new EngineNumber(1, "kg / unit"),
          new YearMatcher(null, null),
        );
      };

      executeLogic();

      const manufactureVal1 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal1.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal1.getUnits(), "kg");

      engine.incrementYear();
      executeLogic();

      const manufactureVal2 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal2.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal2.getUnits(), "kg");

      engine.incrementYear();
      executeLogic();

      const manufactureVal3 = engine.getStream("manufacture");
      assert.closeTo(manufactureVal3.getValue(), 10, 0.0001);
      assert.deepEqual(manufactureVal3.getUnits(), "kg");
    });
  });
}

export {buildEngineTests};
