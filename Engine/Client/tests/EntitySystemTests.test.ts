test("Placeholder", () => {});

// import { EntityComponentSystem } from "../src/EntitySystem/EntitySystem";

// interface Component {}

// class TestComp implements Component {
//     val: string;
//     constructor(data: Partial<TestComp>) {
//         Object.assign(this, data);
//     }
// }

// class TestComp2 implements Component {
//     val: string;
//     constructor(data: Partial<TestComp2>) {
//         Object.assign(this, data);
//     }
// }

// var entitySystem = new EntityComponentSystem();

// test("TestCreateEntity", () => {
//     const newEnt = entitySystem.AddClientEntity();
//     //Client entities are negative!
//     expect(newEnt).toBe(-1);

//     entitySystem.AddComponentToEntity(newEnt, new TestComp({ val: "test" }));
//     entitySystem.AddComponentToEntity(newEnt, new TestComp2({ val: "test2" }));

//     const newEnt2 = entitySystem.AddClientEntity();
//     entitySystem.AddComponentToEntity(newEnt2, new TestComp({ val: "test2" }));

//     expect(entitySystem.GetEntitiesWithData([TestComp], []).length).toBe(2);
//     expect(entitySystem.GetEntitiesWithData([TestComp2], []).length).toBe(1);
//     expect(
//         entitySystem.GetEntitiesWithData([TestComp], [TestComp2]).length
//     ).toBe(1);
// });

// test("TestEntityDataChanges", () => {
//     const newEnt = entitySystem.AddClientEntity();
//     const test = new TestComp({ val: "test" });
//     entitySystem.AddComponentToEntity(newEnt, test);

//     const entData = entitySystem.GetComponentDataForEntity(newEnt);
//     entData.getComponent<TestComp>(TestComp).val = "changed";

//     expect(test.val).toBe("changed");
// });

// // Add benchmarks using benchmark.js or a similar library if needed
