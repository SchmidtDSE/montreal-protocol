import {Engine} from "engine";


function buildEngineTest() {
  
  QUnit.module("engine", function () {
    
    QUnit.test("initializes", function (assert) {
      const engine = new Engine(1, 30);
      assert.ok(engine !== undefined);
    });
  
  });
}


export {buildEngineTest}
