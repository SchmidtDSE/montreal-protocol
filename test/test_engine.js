import { EngineNumber } from "engine_number";

import { Scope, YearMatcher } from "engine_state";

import {Engine} from "engine";


function buildEngineTests() {
  QUnit.module("Engine", function () {
    QUnit.test("initializes", function (assert) {
      const engine = new Engine(1, 30);
      assert.ok(engine !== undefined);
    });

    QUnit.test("changes scope", function (assert) {
      const engine = new Engine(1, 30);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      const scopeOldRet = engine.getScope();
      assert.ok(scopeOldRet.getStanza() === "default");
      assert.ok(scopeOldRet.getApplication() === "test app");
      assert.ok(scopeOldRet.getSubstance() === "test substance");

      engine.setSubstance("test substance 2");

      const scopeNewRet = engine.getScope();
      assert.ok(scopeNewRet.getStanza() === "default");
      assert.ok(scopeNewRet.getApplication() === "test app");
      assert.ok(scopeNewRet.getSubstance() === "test substance 2");
    });

    QUnit.test("increments year", function (assert) {
      const engine = new Engine(1, 3);
      assert.ok(engine.getYear() == 1);
      assert.ok(!engine.getIsDone());

      engine.incrementYear();
      assert.ok(engine.getYear() == 2);
      assert.ok(!engine.getIsDone());

      engine.incrementYear();
      assert.ok(engine.getYear() == 3);
      assert.ok(engine.getIsDone());
    });

    QUnit.test("set stream", function (assert) {
      const engine = new Engine(1, 3);
      
      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream(
        "manufacture",
        new EngineNumber(1, "kg"),
        new YearMatcher(null, null),
      );

      engine.setStream(
        "import",
        new EngineNumber(2, "kg"),
        new YearMatcher(null, null),
      );

      engine.setStream(
        "sales",
        new EngineNumber(30, "kg"),
        new YearMatcher(null, null),
      );

      const manufactureVal = engine.getStream("manufacture");
      assert.ok(manufactureVal.getValue() == 10);
      assert.ok(manufactureVal.getUnits() === "kg");

      const importVal = engine.getStream("import");
      assert.ok(importVal.getValue() == 20);
      assert.ok(importVal.getUnits() === "kg");
    });
    
    QUnit.test("checks year", function (assert) {
      const engine = new Engine(1, 3);
      
      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream(
        "manufacture",
        new EngineNumber(1, "kg"),
        new YearMatcher(null, null),
      );

      engine.setStream(
        "manufacture",
        new EngineNumber(2, "kg"),
        new YearMatcher(1, null),
      );

      engine.setStream(
        "manufacture",
        new EngineNumber(3, "kg"),
        new YearMatcher(2, null),
      );

      const manufactureVal = engine.getStream("manufacture");
      assert.ok(manufactureVal.getValue() == 2);
      assert.ok(manufactureVal.getUnits() === "kg");
    });

    QUnit.test("determines basic emissions", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setInitialCharge(
        new EngineNumber(123, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.emit(new EngineNumber(1, "tCO2e / kg"), new YearMatcher(null, null));

      engine.setStream(
        "manufacture",
        new EngineNumber(2, "units"),
        new YearMatcher(null, null),
      );

      const emissions = engine.getStream("emissions");
      assert.ok(Math.abs(emissions.getValue() - 246) < 0.0001);
      assert.ok(emissions.getUnits() === "tCO2e");
    });

    QUnit.test("change stream", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test substance");

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count1 = engine.getStream("manufacture");
      assert.ok(count1.getValue() == 10);
      assert.ok(count1.getUnits() === "kg");

      engine.incrementYear();

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count2 = engine.getStream("manufacture");
      assert.ok(count2.getValue() == 11);
      assert.ok(count2.getUnits() === "kg");

      engine.incrementYear();

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count3 = engine.getStream("manufacture");
      assert.ok(count3.getValue() == 12.1);
      assert.ok(count3.getUnits() === "kg");
    });

    QUnit.test("manages parallel stream", function (assert) {
      const engine = new Engine(1, 3);

      const scope1 = new Scope("default", "test app", "sub 1");

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 1");

      engine.setStream(
        "manufacture",
        new EngineNumber(1, "kg"),
        new YearMatcher(null, null),
      );

      const manufacture1ValDirect = engine.getStream("manufacture");
      assert.ok(manufacture1ValDirect.getValue() == 1);
      assert.ok(manufacture1ValDirect.getUnits() === "kg");

      const manufacture1ValIndirect = engine.getStream("manufacture");
      assert.ok(manufacture1ValIndirect.getValue() == 1);
      assert.ok(manufacture1ValIndirect.getUnits() === "kg");

      engine.setSubstance("sub 2");

      engine.setStream(
        "manufacture",
        new EngineNumber(2, "kg"),
        new YearMatcher(null, null),
      );

      const manufacture2ValDirect = engine.getStream("manufacture");
      assert.ok(manufacture2ValDirect.getValue() == 2);
      assert.ok(manufacture2ValDirect.getUnits() === "kg");

      const manufacture2ValIndirect = engine.getStream("manufacture");
      assert.ok(manufacture2ValIndirect.getValue() == 2);
      assert.ok(manufacture2ValIndirect.getUnits() === "kg");

      const manufactureValParallel = engine.getStream("manufacture", scope1);
      assert.ok(manufactureValParallel.getValue() == 1);
      assert.ok(manufactureValParallel.getUnits() === "kg");
    });

    QUnit.test("manages variables", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");

      engine.defineVariable("testVar");
      engine.setVariable("testVar", 123);
      assert.ok(engine.getVariable("testVar") == 123);

      engine.setSubstance("sub 1");
      engine.setVariable("testVar", 124);
      assert.ok(engine.getVariable("testVar") == 124);

      engine.setSubstance("sub 2");
      engine.defineVariable("testVar");
      engine.setVariable("testVar", 125);
      assert.ok(engine.getVariable("testVar") == 125);

      engine.setSubstance("sub 3");
      assert.ok(engine.getVariable("testVar") == 124);
    });

    QUnit.test("applies caps", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream(
        "manufacture",
        new EngineNumber(15, "kg"),
        new YearMatcher(null, null),
      );

      engine.cap(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      const firstCapVal = engine.getStream("manufacture");
      assert.ok(Math.abs(firstCapVal.getValue() - 10) < 0.0001);
      assert.ok(firstCapVal.getUnits() === "kg");

      engine.cap(
        "manufacture",
        new EngineNumber(50, "%"),
        new YearMatcher(null, null),
      );

      const secondCapVal = engine.getStream("manufacture");
      assert.ok(Math.abs(secondCapVal.getValue() - 5) < 0.0001);
      assert.ok(secondCapVal.getUnits() === "kg");
    });

    QUnit.test("replaces substances", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 1");

      engine.setStream(
        "manufacture",
        new EngineNumber(5, "kg"),
        new YearMatcher(null, null),
      );

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("sub 2");

      engine.setStream(
        "manufacture",
        new EngineNumber(5, "kg"),
        new YearMatcher(null, null),
      );

      engine.replace(
        new EngineNumber(2, "kg"),
        "manufacture",
        "sub 1",
        new YearMatcher(null, null),
      );

      engine.setSubstance("sub 1");
      const sub1Manufacture = engine.getStream("manufacture");
      assert.ok(Math.abs(sub1Manufacture.getValue() - 7) < 0.0001);
      assert.ok(sub1Manufacture.getUnits() === "kg");

      engine.setSubstance("sub 2");
      const sub2Manufacture = engine.getStream("manufacture");
      assert.ok(Math.abs(sub2Manufacture.getValue() - 3) < 0.0001);
      assert.ok(sub2Manufacture.getUnits() === "kg");
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

      engine.setStream(
        "manufacture",
        new EngineNumber(25, "kg"),
        new YearMatcher(null, null),
      );

      engine.setStream(
        "import",
        new EngineNumber(20, "kg"),
        new YearMatcher(null, null),
      );

      const population = engine.getStream("equipment");
      assert.ok(Math.abs(population.getValue() - 7) < 0.0001);
      assert.ok(population.getUnits() === "units");
    });

    // Test split sales with different initial charge and intervention

    /*QUnit.test("converts to units", function (assert) {
      const engine = new Engine(1, 3);

      engine.setStanza("default");
      engine.setApplication("test app");
      engine.setSubstance("test sub");

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(2, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("equipment");
      assert.ok(manufactureVal1.getValue() == 5);
      assert.ok(manufactureVal1.getUnits() === "units");
    });

    QUnit.test("retires equipment", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.retire(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const manufactureVal1 = engine.getStream("equipment");
      assert.ok(manufactureVal1.getValue() == 10);
      assert.ok(manufactureVal1.getUnits() === "units");

      engine.incrementYear();

      engine.retire(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getStream("equipment");
      assert.ok(manufactureVal2.getValue() == 9);
      assert.ok(manufactureVal2.getUnits() === "units");
    });
  
    QUnit.test("recharges", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.incrementYear();

      engine.recharge(
        new EngineNumber(10, "% / year"),
        new EngineNumber(1, "kg / unit"),
        new YearMatcher(null, null),
      );

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getStream("equipment");
      assert.ok(manufactureVal2.getValue() == 19);
      assert.ok(manufactureVal2.getUnits() === "units");
    });

    QUnit.test("recycles", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

      engine.setStream(
        "manufacture",
        new EngineNumber(10, "kg"),
        new YearMatcher(null, null),
      );

      engine.setInitialCharge(
        new EngineNumber(1, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.incrementYear();

      recycle(collectionWithUnits, yieldWithUnits, displaceName, yearMatcher)
      engine.recycle(
        new EngineNumber(30, "%"),
        new EngineNumber(100, "%"),
        "manufacture",
        new YearMatcher(null, null),
      );

      const manufactureVal = engine.getStream("manufacture");
      assert.ok(manufactureVal.getValue() == 7);
      assert.ok(manufactureVal.getUnits() === "kg");

      const reuseVal = engine.getStream("reuse");
      assert.ok(reuseVal.getValue() == 3);
      assert.ok(reuseVal.getUnits() === "kg");
    });*/
  });
}

export { buildEngineTests };
