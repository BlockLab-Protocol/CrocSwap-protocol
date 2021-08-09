import { TestLiquidityCurve } from '../typechain/TestLiquidityCurve'
import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers } from 'hardhat';
import { toSqrtPrice, toFixedGrowth, fromSqrtPrice, fromFixedGrowth } from './FixedPoint';
import { solidity } from "ethereum-waffle";
import chai from "chai";

chai.use(solidity);

describe('LiquidityCurve', () => {
   let curve: TestLiquidityCurve

   beforeEach("deploy contract", async () => {
      const factory = await ethers.getContractFactory("TestLiquidityCurve");
      curve = (await factory.deploy()) as TestLiquidityCurve;
   })

   it("liquidity receive ambient", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqRecAmb(1500);
      
      expect(await curve.baseFlow()).to.equal(3938);
      expect(await curve.quoteFlow()).to.equal(1751);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(23125);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(7500)
      expect(state.liq_.concentrated_.toNumber()).to.equal(10000);
      expect(fromFixedGrowth(state.accum_.ambientGrowth_)).to.equal(0.75);
      expect(fromFixedGrowth(state.accum_.concTokenGrowth_)).to.equal(2.5);
   })

   it("liquidity pay ambient", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqPayAmb(1500);
      
      expect(await curve.baseFlow()).to.equal(3937);
      expect(await curve.quoteFlow()).to.equal(1750);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(17875);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(4500)
      expect(state.liq_.concentrated_.toNumber()).to.equal(10000);
      expect(fromFixedGrowth(state.accum_.ambientGrowth_)).to.equal(0.75);
      expect(fromFixedGrowth(state.accum_.concTokenGrowth_)).to.equal(2.5);
   })

   it("liquidity receive concentrated", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqRecConc(1500, toSqrtPrice(1.96), toSqrtPrice(2.89));
      
      expect(await curve.baseFlow()).to.equal(151);
      expect(await curve.quoteFlow()).to.equal(118);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(22000);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(6000)
      expect(state.liq_.concentrated_.toNumber()).to.equal(11500);
      expect(fromFixedGrowth(state.accum_.ambientGrowth_)).to.equal(0.75);
      expect(fromFixedGrowth(state.accum_.concTokenGrowth_)).to.equal(2.5);
   })

   it("liquidity pay concentrated", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqPayConc(1500, toSqrtPrice(1.96), toSqrtPrice(2.89), 0);
      
      expect(await curve.baseFlow()).to.equal(150);
      expect(await curve.quoteFlow()).to.equal(117);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(19000);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(6000)
      expect(state.liq_.concentrated_.toNumber()).to.equal(8500);
      expect(fromFixedGrowth(state.accum_.ambientGrowth_)).to.equal(0.75);
      expect(fromFixedGrowth(state.accum_.concTokenGrowth_)).to.equal(2.5);
   })

   it("liquidity below range", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqPayConc(1500, toSqrtPrice(1.44), toSqrtPrice(1.96), 0);
      
      expect(await curve.baseFlow()).to.equal(299);
      expect(await curve.quoteFlow()).to.equal(0);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(20500);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(6000)
      expect(state.liq_.concentrated_.toNumber()).to.equal(10000);
   })

   it("liquidity above range", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqPayConc(1500, toSqrtPrice(4), toSqrtPrice(6.25), 0);
      
      expect(await curve.baseFlow()).to.equal(0);
      expect(await curve.quoteFlow()).to.equal(150);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(20500);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(6000)
      expect(state.liq_.concentrated_.toNumber()).to.equal(10000);
   })

   it("liquidity rewards", async () => {
      await curve.fixCurve(toSqrtPrice(2.25), 6000, 10000);
      await curve.fixAccum(toFixedGrowth(0.75), toFixedGrowth(2.5));
      await curve.testLiqPayConc(1500, toSqrtPrice(4), toSqrtPrice(6.25), 
         toFixedGrowth(0.8));
      
      expect(await curve.baseFlow()).to.equal(3147);
      expect(await curve.quoteFlow()).to.equal(150 + 1398);
      expect((await curve.pullTotalLiq()).toNumber()).to.lte(19400);

      let state = await curve.pullCurve();
      expect(fromSqrtPrice(state.priceRoot_)).to.equal(2.25)
      expect(state.liq_.ambientSeed_.toNumber()).to.equal(4801)
      expect(state.liq_.concentrated_.toNumber()).to.equal(10000);
   })

})
