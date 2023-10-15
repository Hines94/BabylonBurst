import { Component, TrackedVariable } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySystem } from "../EntitySystem/EntitySystem";

const entSystem = new EntitySystem();
var removeCalled = false;
var addCalled = false;
var changeCalled = false;

class TestComp extends Component {

}

class TestComp2 extends Component {
    @TrackedVariable()
    someVar = "test";

    override onComponentRemoved(entData: EntityData): void {
        removeCalled = true;
    }
    override onComponentAdded(entData: EntityData): void {
        addCalled = true;
    }
    override onComponentChanged(entData: EntityData): void {
        changeCalled = true;
    }
}

test("EntitySystemAddEntity", () => {
    const newEnt = entSystem.AddEntity();
    expect(newEnt.EntityId).toBe(1);
    const newEnt2 = entSystem.AddEntity();
    expect(newEnt2.EntityId).toBe(2);
});

test("EntitySystemAddComponent", () => {
    const testC = new TestComp();
    entSystem.AddSetComponentToEntity(1,testC);
    const entData = entSystem.GetEntityData(1);
    expect(entData.Components.includes(testC)).toBe(true);
    expect(entData.GetComponent(TestComp)).toBe(testC);
});

test("EntitySystemFindEntities", () => {
    const thirdEnt = entSystem.AddEntity();
    const testC = new TestComp();
    entSystem.AddSetComponentToEntity(2,testC);
    entSystem.AddSetComponentToEntity(2,new TestComp2());
    const testC2 = new TestComp2()
    entSystem.AddSetComponentToEntity(thirdEnt,testC2);

    testC2.someVar = "changed";
    expect(entSystem.IsChangedComponent(thirdEnt,TestComp2)).toBe(true);
    
    //Query with changed only
    const ALLQuery = entSystem.GetEntitiesWithData([TestComp2],[]);
    ALLQuery.AddChanged_ALL_Filter();
    expect(ALLQuery.GetNumEntities()).toBe(1);
    
    entSystem.ResetChangedComponents();
    expect(entSystem.IsChangedComponent(2,TestComp2)).toBe(false);

    expect(entSystem.GetEntitiesWithData([TestComp],[TestComp2]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestComp,TestComp2],[]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(2);
    expect(entSystem.GetEntitiesWithData([TestComp2],[]).GetNumEntities()).toBe(2);
});

test("EntitySystemRemoveEntities", () => {
    entSystem.RemoveEntity(1);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(1);
})

test("EntitySystemRemoveComponent", () => {
    entSystem.RemoveComponent(2,TestComp);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(0);
})

test("EntitySystemResetSystem", () => {
    entSystem.ResetSystem();
    expect(entSystem.GetEntitiesWithData([],[]).GetNumEntities()).toBe(0);
})

test("EntitySystemEventsFired", () => {
    expect(addCalled).toBe(true);
    expect(removeCalled).toBe(true);
    expect(changeCalled).toBe(true);
})