import { LdfResponseMockerFactory } from "../../lib/factory/LdfResponseMockerFactory";
import { LdfTestCaseEvaluation } from "../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
import { LdfResponseMocker } from "../../lib/testcase/ldf/mock/LdfResponseMocker";

describe('LdfResponseMockerFactory', () => {

  describe('constructor', () => {

    it('should use default port', async () => {

      const factory: LdfResponseMockerFactory = new LdfResponseMockerFactory();
      const mocker: LdfResponseMocker = await factory.getNewLdfResponseMocker();
      expect(mocker.proxyAddress).toEqual('http://127.0.0.1:3000/');

    });

    it('should use the next port when the port is in use', async () => {

      const factory1: LdfResponseMockerFactory = new LdfResponseMockerFactory();
      const factory2: LdfResponseMockerFactory = new LdfResponseMockerFactory();

      const mocker1: LdfResponseMocker = await factory1.getNewLdfResponseMocker();
      await mocker1.setUpServer(new LdfTestCaseEvaluation(undefined, undefined, undefined));
      const mocker2: LdfResponseMocker = await factory2.getNewLdfResponseMocker();

      mocker1.tearDownServer();
      mocker2.tearDownServer();
      expect(mocker2.proxyAddress !== mocker1.proxyAddress).toBeTruthy();
    });

  });

});
