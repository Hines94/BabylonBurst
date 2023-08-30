import { Component, RegisteredComponent, Saved } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntityLoader } from "../EntitySystem/EntityLoader";
import { EntitySaver } from "../EntitySystem/EntitySaver";
import { EntitySystem } from "../EntitySystem/EntitySystem";

@RegisteredComponent
class TestComp extends Component {
    @Saved
    data:string = "test";
}

@RegisteredComponent
class TestComp2 extends Component {
    data = "testComp2";
    @Saved
    otherdata = 1;
    @Saved
    testEntity:EntityData;
}

@RegisteredComponent
class TestComp3 extends Component {
    @Saved
    data = "testComp3";
}

const entSystem = new EntitySystem();


test("EntitySystemSaveAllEntities", () => {
    const newent = entSystem.AddEntity();
    const newTestC = new TestComp();
    newTestC.data = "changed";
    entSystem.AddSetComponentToEntity(newent, newTestC);
    const newTestC2 = new TestComp2();
    newTestC2.data = "changedData"
    newTestC2.otherdata = 5
    entSystem.AddSetComponentToEntity(newent,newTestC2);
    entSystem.AddSetComponentToEntity(newent,new TestComp3());
    const newent2 = entSystem.AddEntity();
    newTestC2.testEntity = newent2;
    entSystem.AddSetComponentToEntity(newent2,new TestComp());

    const save = EntitySaver.GetMsgpackForAllEntities(entSystem); 

    //Get template
    const reload = EntityLoader.GetEntityTemplateFromMsgpack(save);
    expect(reload.DoesEntityExist(1)).toBe(true);
    expect(reload.DoesEntityExist(3)).toBe(false);

    //Check Entity is saved correctly
    expect(reload.GetRawComponentData(1,TestComp2.name)[1]).toBe(2);

    const testComp = reload.GetEntityComponent(1,TestComp,{});
    expect(testComp.data).toBe("changed");
    expect(reload.GetEntityComponent(1,TestComp2,{}).data).toBe("testComp2");
    expect(reload.GetEntityComponent(1,TestComp2,{}).otherdata).toBe(5);
    expect(reload.GetEntityComponent(2,TestComp2,{})).toBe(undefined);

    //Load ents into new entities
    EntityLoader.LoadTemplateIntoNewEntities(reload,entSystem);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(4);
    expect(entSystem.GetEntityData(3).GetComponent(TestComp2).testEntity).toBe(entSystem.GetEntityData(4));
    //Load into existing entities
    
});
