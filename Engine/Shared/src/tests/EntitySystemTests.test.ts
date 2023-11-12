import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { TrackedVariable } from "../EntitySystem/TrackedVariable";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";
import { InstancedRender } from "../Rendering/InstancedRender";

const entSystem = new EntitySystem();
var removeCalled = false;
var addCalled = false;
var changeCalled = false;

@RegisteredType(TestEntComp)
class TestEntComp extends Component {

}

@RegisteredType(TestEntCompChild)
class TestEntCompChild extends TestEntComp {

}

@RegisteredType(TestEntComp2)
class TestEntComp2 extends Component {
    @TrackedVariable()
    @Saved(String)
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
    const testC = new TestEntComp();
    entSystem.AddSetComponentToEntity(1,testC);
    const entData = entSystem.GetEntityData(1);
    expect(entData.Components[testC.constructor.name]).not.toBe(undefined);
    expect(entData.GetComponent(TestEntComp)).toBe(testC);
});

test("EntitySystemFindEntities", () => {
    const thirdEnt = entSystem.AddEntity();
    const testC = new TestEntComp();
    entSystem.AddSetComponentToEntity(2,testC);
    entSystem.AddSetComponentToEntity(2,new TestEntComp2());
    entSystem.ResetChangedComponents();

    const testC2 = new TestEntComp2()
    entSystem.AddSetComponentToEntity(thirdEnt,testC2);
    testC2.someVar = "changed";
    expect(entSystem.IsChangedComponent(thirdEnt,TestEntComp2)).toBe(true);
    
    //Query with changed only
    const ALLQuery = entSystem.GetEntitiesWithData([TestEntComp2],[]);
    ALLQuery.AddChanged_ALL_Filter();
    expect(ALLQuery.GetNumEntities()).toBe(1);
    
    entSystem.ResetChangedComponents();
    expect(entSystem.IsChangedComponent(2,TestEntComp2)).toBe(false);
    expect(changeCalled).toBe(true);

    expect(entSystem.GetEntitiesWithData([TestEntComp],[TestEntComp2]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestEntComp,TestEntComp2],[]).GetNumEntities()).toBe(1);
    expect(entSystem.GetEntitiesWithData([TestEntComp],[]).GetNumEntities()).toBe(2);
    expect(entSystem.GetEntitiesWithData([TestEntComp2],[]).GetNumEntities()).toBe(2);
});

test("EntitySystemRequiredComponents", () => {
    const newEnt = entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(newEnt,new InstancedRender());
    expect(newEnt.GetComponentByName("EntTransform")).not.toBe(undefined);
})

test("EntitySystemRemoveEntities", () => {
    entSystem.RemoveEntity(1);
    expect(entSystem.GetEntitiesWithData([TestEntComp],[]).GetNumEntities()).toBe(1);
})

test("EntitySystemRemoveComponent", () => {
    entSystem.RemoveComponent(2,TestEntComp);
    expect(entSystem.GetEntitiesWithData([TestEntComp],[]).GetNumEntities()).toBe(0);
})

test("EntitySystemResetSystem", () => {
    entSystem.ResetSystem();
    expect(entSystem.GetEntitiesWithData([],[]).GetNumEntities()).toBe(0);
})

test("EntitySystemEventsFired", () => {
    expect(addCalled).toBe(true);
    expect(removeCalled).toBe(true);
})