import { Component } from "../EntitySystem/Component";
import { EntitySystem } from "../EntitySystem/EntitySystem";

const entSystem = new EntitySystem();

class TestComp extends Component {

}

class TestComp2 extends Component {

}

test("EntitySystemAddEntity", () => {
    const newComp = entSystem.AddEntity();
    expect(newComp.EntityId).toBe(1);
});

test("EntitySystemAddComponent", () => {
    const testC = new TestComp();
    entSystem.AddSetComponentToEntity(1,testC);
    const entData = entSystem.GetEntityData(1);
    expect(entData.Components.includes(testC)).toBe(true);
    expect(entData.GetComponent(TestComp)).toBe(testC);
});

test("EntitySystemFindEntities", () => {
    const secondEnt = entSystem.AddEntity();
    const testC = new TestComp();
    entSystem.AddSetComponentToEntity(2,testC);
    entSystem.AddSetComponentToEntity(2,new TestComp2());
    
    expect(entSystem.GetEntitiesWithData([TestComp],[TestComp2]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestComp,TestComp2],[]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(2);
    expect(entSystem.GetEntitiesWithData([TestComp2],[]).GetNumEntities()).toBe(1);
});

test("EntitySystemRemoveEntities", () => {
    entSystem.RemoveEntity(1);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(1);
})
