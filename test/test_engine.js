import { Engine, EngineNumber, Scope, YearMatcher } from "engine";

function buildEngineTest() {
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

  QUnit.module("YearMatcher", function () {
    QUnit.test("initializes", function (assert) {
      const matcher = new YearMatcher(null, null);
      assert.ok(matcher !== undefined);
    });

    QUnit.test("matches any", function (assert) {
      const matcher = new YearMatcher(null, null);
      assert.ok(matcher.matches(1));
    });

    QUnit.test("matches after", function (assert) {
      const matcher = new YearMatcher(2, null);
      assert.ok(!matcher.matches(1));
      assert.ok(matcher.matches(2));
      assert.ok(matcher.matches(3));
    });

    QUnit.test("matches before", function (assert) {
      const matcher = new YearMatcher(null, 2);
      assert.ok(matcher.matches(1));
      assert.ok(matcher.matches(2));
      assert.ok(!matcher.matches(3));
    });

    QUnit.test("matches within", function (assert) {
      const matcher = new YearMatcher(2, 3);
      assert.ok(!matcher.matches(1));
      assert.ok(matcher.matches(2));
      assert.ok(matcher.matches(3));
      assert.ok(!matcher.matches(4));
    });
  });

  QUnit.module("Scope", function () {
    QUnit.test("initalizes", function (assert) {
      const scope = new Scope("default", "test app", "test substance");
      assert.ok(scope !== undefined);
    });

    QUnit.test("getters", function (assert) {
      const scope = new Scope("default", "test app", "test substance");
      assert.ok(scope.getStanza() === "default");
      assert.ok(scope.getApplication() === "test app");
      assert.ok(scope.getSubstance() === "test substance");
    });

    QUnit.test("changes substance", function (assert) {
      const scopeOld = new Scope("default", "test app", "test substance");
      const scopeNew = scopeOld.getWithSubstance("test substance 2");
      assert.ok(scopeNew.getStanza() === "default");
      assert.ok(scopeNew.getApplication() === "test app");
      assert.ok(scopeNew.getSubstance() === "test substance 2");
    });

    QUnit.test("changes application", function (assert) {
      const scopeOld = new Scope("default", "test app", "test substance");
      const scopeNew = scopeOld.getWithApplication("test app 2");
      assert.ok(scopeNew.getStanza() === "default");
      assert.ok(scopeNew.getApplication() === "test app 2");
      assert.ok(scopeNew.getSubstance() === null);
    });

    QUnit.test("changes stanza", function (assert) {
      const scopeOld = new Scope("default", "test app", "test substance");
      const scopeNew = scopeOld.getWithStanza('policy "test policy"');
      assert.ok(scopeNew.getStanza() === 'policy "test policy"');
      assert.ok(scopeNew.getApplication() === null);
      assert.ok(scopeNew.getSubstance() === null);
    });

    QUnit.test("writes and reads var", function (assert) {
      const scope = new Scope("default", "test app", "test substance");
      scope.defineVariable("testVar");
      scope.setVariable("testVar", 123);
      assert.ok(scope.getVariable("testVar") == 123);
    });

    QUnit.test("shadows a var", function (assert) {
      const oldScope = new Scope("default", "test app", null);
      oldScope.defineVariable("testVar");
      oldScope.setVariable("testVar", 123);
      assert.ok(oldScope.getVariable("testVar") == 123);

      const newScope = oldScope.getWithSubstance("test substance 2");
      assert.ok(newScope.getVariable("testVar") == 123);

      newScope.setVariable("testVar", 124);
      assert.ok(newScope.getVariable("testVar") == 124);
    });

    QUnit.test("unshadows a var", function (assert) {
      const oldScope = new Scope("default", "test app", null);
      oldScope.defineVariable("testVar");
      oldScope.setVariable("testVar", 123);
      assert.ok(oldScope.getVariable("testVar") == 123);

      const tempScope = oldScope.getWithSubstance("test substance 2");
      tempScope.setVariable("testVar", 124);

      const newScope = tempScope.getWithSubstance("test substance 3");
      assert.ok(newScope.getVariable("testVar") == 123);
    });
  });

  QUnit.module("Engine", function () {
    QUnit.test("initializes", function (assert) {
      const engine = new Engine(1, 30);
      assert.ok(engine !== undefined);
    });

    QUnit.test("changes scope", function (assert) {
      const engine = new Engine(1, 30);

      const scopeOld = new Scope("default", "test app", "test substance");
      engine.setScope(scopeOld);

      const scopeOldRet = engine.getScope();
      assert.ok(scopeOldRet.getStanza() === "default");
      assert.ok(scopeOldRet.getApplication() === "test app");
      assert.ok(scopeOldRet.getSubstance() === "test substance 2");

      const scopeNew = scopeOld.getWithSubstance("test substance 2");
      engine.setScope(scopeNew);

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

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

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

      const manufactureVal = engine.getVariable("manufacture");
      assert.ok(manufactureVal.getValue() == 10);
      assert.ok(manufactureVal.getUnits() === "kg");

      const importVal = engine.getVariable("import");
      assert.ok(importVal.getValue() == 20);
      assert.ok(importVal.getUnits() === "kg");
    });

    QUnit.test("checks year", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

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
        new EngineNumber(3, "kg");
        new YearMatcher(2, null),
      );

      const manufactureVal = engine.getVariable("manufacture");
      assert.ok(manufactureVal.getValue() == 2);
      assert.ok(manufactureVal.getUnits() === "kg");
    });

    QUnit.test("determines basic emissions", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

      engine.setInitialCharge(
        new EngineNumber(123, "kg / unit"),
        "sales",
        new YearMatcher(null, null),
      );

      engine.emit("emit 1 tCO2 / kg", new YearMatcher(null, null));

      engine.setStream(
        "manufacture",
        new EngineNumber(2, "kg"),
        new YearMatcher(null, null),
      );

      const emissions = engine.getVariable("emissions");
      assert.ok(emissions.getValue() == 246);
      assert.ok(emissions.getUnits() === "tCO2e");
    });

    QUnit.test("change stream", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

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

      const count1 = engine.getVariable("manufacture");
      assert.ok(count1.getValue() == 10);
      assert.ok(count1.getUnits() === "kg");

      engine.incrementYear();

      engine.changeStream(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const count2 = engine.getVariable("manufacture");
      assert.ok(count2.getValue() == 11);
      assert.ok(count2.getUnits() === "kg");
    });

    QUnit.test("manages parallel stream", function (assert) {
      const engine = new Engine(1, 3);

      const scope1 = new Scope("default", "test app", "sub 1");
      engine.setScope(scope1);

      engine.setStream(
        "manufacture",
        new EngineNumber(1, "kg"),
        new YearMatcher(null, null),
      );

      const manufacture1ValDirect = engine.getVariable("manufacture");
      assert.ok(manufacture1ValDirect.getValue() == 1);
      assert.ok(manufacture1ValDirect.getUnits() === "kg");

      const manufacture1ValIndirect = engine.getStream("manufacture", null);
      assert.ok(manufacture1ValIndirect.getValue() == 1);
      assert.ok(manufacture1ValIndirect.getUnits() === "kg");

      const scope2 = new Scope("default", "test app", "sub 2");
      engine.setScope(scope2);

      engine.setStream(
        "manufacture",
        new EngineNumber(2, "kg"),
        new YearMatcher(null, null),
      );

      const manufacture2ValDirect = engine.getVariable("manufacture");
      assert.ok(manufacture2ValDirect.getValue() == 2);
      assert.ok(manufacture2ValDirect.getUnits() === "kg");

      const manufacture2ValIndirect = engine.getStream("manufacture", null);
      assert.ok(manufacture2ValIndirect.getValue() == 2);
      assert.ok(manufacture2ValIndirect.getUnits() === "kg");

      const manufactureValParallel = engine.getStream("manufacture", scope1);
      assert.ok(manufactureValParallel.getValue() == 1);
      assert.ok(manufactureValParallel.getUnits() === "kg");
    });

    QUnit.test("manages variables", function (assert) {
      const engine = new Engine(1, 3);

      const oldScope = new Scope("default", "test app", null);
      engine.setScope(oldScope);

      engine.defineVariable("testVar");
      egnine.setVariable("testVar", 123);
      assert.ok(engine.getVariable("testVar") == 123);

      const tempScope = oldScope.getWithSubstance("test substance 2");
      engine.setScope(tempScope);
      engine.setVariable("testVar", 124);
      assert.ok(engine.getVariable("testVar") == 124);

      const newScope = tempScope.getWithSubstance("test substance 3");
      engine.setScope(newScope);
      assert.ok(engine.getVariable("testVar") == 123);
    });

    QUnit.test("applies caps", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

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

      const firstCapVal = engine.get("manufacture");
      assert.ok(firstCapVal == 10);

      engine.cap(
        "manufacture",
        new EngineNumber(50, "%"),
        new YearMatcher(null, null),
      );

      const secondCapVal = engine.get("manufacture");
      assert.ok(secondCapVal == 5);
    });

    QUnit.test("replaces substances", function (assert) {
      const engine = new Engine(1, 3);

      const scope1 = new Scope("default", "test app", "sub 1");
      engine.setScope(scope1);

      engine.setStream(
        "manufacture",
        new EngineNumber(5, "kg"),
        new YearMatcher(null, null),
      );

      const scope2 = new Scope("default", "test app", "sub 2");
      engine.setScope(scope2);

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

      engine.setScope(scope1);
      assert.ok(engine.getVariable("manufacture") == 7);

      engine.setScope(scope2);
      assert.ok(engine.getVariable("manufacture") == 3);
    });

    QUnit.test("converts to units", function (assert) {
      const engine = new Engine(1, 3);

      const scope = new Scope("default", "test app", "test substance");
      engine.setScope(scope);

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

      const manufactureVal1 = engine.getVariable("equipment");
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

      const manufactureVal1 = engine.getVariable("equipment");
      assert.ok(manufactureVal1.getValue() == 10);
      assert.ok(manufactureVal1.getUnits() === "units");

      engine.incrementYear();

      engine.retire(
        "manufacture",
        new EngineNumber(10, "% / year"),
        new YearMatcher(null, null),
      );

      const manufactureVal2 = engine.getVariable("equipment");
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

      const manufactureVal2 = engine.getVariable("equipment");
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

      const manufactureVal = engine.getVariable("manufacture");
      assert.ok(manufactureVal.getValue() == 7);
      assert.ok(manufactureVal.getUnits() === "kg");

      const reuseVal = engine.getVariable("reuse");
      assert.ok(reuseVal.getValue() == 3);
      assert.ok(reuseVal.getUnits() === "kg");
    });
    
  });
}

export { buildEngineTest };
