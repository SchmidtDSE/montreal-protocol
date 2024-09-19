import {YearMatcher, Scope} from "engine_state";

function buildEngineStateTests() {
  QUnit.module("YearMatcher", function () {
    QUnit.test("initializes", function (assert) {
      const matcher = new YearMatcher(null, null);
      assert.ok(matcher !== undefined);
    });

    QUnit.test("matches any", function (assert) {
      const matcher = new YearMatcher(null, null);
      assert.ok(matcher.getInRange(1));
    });

    QUnit.test("matches after", function (assert) {
      const matcher = new YearMatcher(2, null);
      assert.ok(!matcher.getInRange(1));
      assert.ok(matcher.getInRange(2));
      assert.ok(matcher.getInRange(3));
    });

    QUnit.test("matches before", function (assert) {
      const matcher = new YearMatcher(null, 2);
      assert.ok(matcher.getInRange(1));
      assert.ok(matcher.getInRange(2));
      assert.ok(!matcher.getInRange(3));
    });

    QUnit.test("matches within", function (assert) {
      const matcher = new YearMatcher(2, 3);
      assert.ok(!matcher.getInRange(1));
      assert.ok(matcher.getInRange(2));
      assert.ok(matcher.getInRange(3));
      assert.ok(!matcher.getInRange(4));
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

    QUnit.test("reads upwards in scope", function (assert) {
      const oldScope = new Scope("default", "test app", null);
      oldScope.defineVariable("testVar");
      oldScope.setVariable("testVar", 123);
      assert.ok(oldScope.getVariable("testVar") == 123);

      const newScope = oldScope.getWithSubstance("test substance 2");
      assert.ok(newScope.getVariable("testVar") == 123);

      newScope.setVariable("testVar", 124);
      assert.ok(newScope.getVariable("testVar") == 124);
    });

    QUnit.test("shadows a variable", function (assert) {
      const oldScope = new Scope("default", "test app", null);
      oldScope.defineVariable("testVar");
      oldScope.setVariable("testVar", 123);
      assert.ok(oldScope.getVariable("testVar") == 123);

      const newScope = oldScope.getWithSubstance("test substance 2");
      newScope.defineVariable("testVar");
      newScope.setVariable("testVar", 124);
      assert.ok(newScope.getVariable("testVar") == 124);

      const restoredScope = newScope.getWithSubstance("test substance 3");
      assert.ok(restoredScope.getVariable("testVar") == 123);
    });

    QUnit.test("edits scopes above", function (assert) {
      const oldScope = new Scope("default", "test app", null);
      oldScope.defineVariable("testVar");
      oldScope.setVariable("testVar", 123);
      assert.ok(oldScope.getVariable("testVar") == 123);

      const tempScope = oldScope.getWithSubstance("test substance 2");
      tempScope.setVariable("testVar", 124);

      const newScope = tempScope.getWithSubstance("test substance 3");
      assert.ok(newScope.getVariable("testVar") == 124);
    });
  });
}

export {buildEngineStateTests};
