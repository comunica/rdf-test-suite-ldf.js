import { LdfResponseMockerFactory } from "../../lib/factory/LdfResponseMockerFactory";
import { LdfResponseMocker } from "../../lib/testcase/ldf/mock/LdfResponseMocker";

describe('LdfResponseMockerFactory', () => {

  describe('constructor', () => {

    it('should use default port', async () => {

      const factory: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> {});
      const mocker: LdfResponseMocker = await factory.getNewLdfResponseMocker();
      expect(mocker.proxyAddress).toEqual('http://127.0.0.1:3000/');

    });

    it('should error when the port is in use', async () => {

      const factory1: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> { startPort: 7777 });
      const factory2: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> { startPort: 7777 });

      const mocker1: LdfResponseMocker = await factory1.getNewLdfResponseMocker();
      await mocker1.setUpServer();

      await expect(factory2.getNewLdfResponseMocker()).rejects.toBeTruthy();
      await mocker1.tearDownServer();
    });

    it('should error when the port is invalid', async () => {

      const factory: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> { startPort: -1000 });
      await expect(factory.getNewLdfResponseMocker()).rejects.toBeTruthy();

    });

  });

});
