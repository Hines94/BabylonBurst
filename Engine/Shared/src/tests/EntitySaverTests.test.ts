import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntityLoader } from "../EntitySystem/EntityLoader";
import { EntitySaver } from "../EntitySystem/EntitySaver";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType
class TestComp extends Component {
    @Saved()
    data:string = "test";
}

@RegisteredType
class TestComp2 extends Component {
    data = "testComp2";
    @Saved()
    otherdata = 1;
    @Saved()
    testEntity:EntityData;
}

@RegisteredType
class nestedData {
    @Saved()
    nestedEntity:EntityData;
}

@RegisteredType
class TestComp3 extends Component {
    @Saved()
    data = "testComp3";
    @Saved(nestedData)
    nestData = new nestedData();
    @Saved(EntityData)
    testArray:EntityData[] = [];
}

const entSystem = new EntitySystem();


test("EntitySystemSaveAllEntities", () => {
    const newent = entSystem.AddEntity();
    const newTestC = new TestComp();
    newTestC.data = "changed";
    entSystem.AddSetComponentToEntity(newent, newTestC);
    const newTestC2 = new TestComp2();
    newTestC2.data = "changedData";
    newTestC2.otherdata = 5
    entSystem.AddSetComponentToEntity(newent,newTestC2);
    const newent2 = entSystem.AddEntity();
    newTestC2.testEntity = newent2;
    entSystem.AddSetComponentToEntity(newent2,new TestComp());
    const testComp3 = new TestComp3()
    testComp3.nestData.nestedEntity = newent;
    testComp3.testArray.push(newent);
    entSystem.AddSetComponentToEntity(newent2,testComp3);

    const save = EntitySaver.GetMsgpackForAllEntities(entSystem); 

    //Get template
    const reloadTemplate = EntityLoader.GetEntityTemplateFromMsgpack(save);
    expect(reloadTemplate.DoesEntityExist(1)).toBe(true);
    expect(reloadTemplate.DoesEntityExist(3)).toBe(false);
    expect(reloadTemplate.GetRawComponentData(1,TestComp2.name)[1]).toBe(2);
    const testComp = reloadTemplate.GetEntityComponent(1,TestComp,undefined,{});
    expect(testComp.data).toBe("changed");
    expect(reloadTemplate.GetEntityComponent(1,TestComp2,undefined,{}).data).toBe("testComp2");
    expect(reloadTemplate.GetEntityComponent(1,TestComp2,undefined,{}).otherdata).toBe(5);
    expect(reloadTemplate.GetEntityComponent(2,TestComp2,undefined,{})).toBe(undefined);

    //Load ents into new entities
    EntityLoader.LoadTemplateIntoNewEntities(reloadTemplate,entSystem);
    expect(entSystem.GetEntitiesWithData([TestComp],[]).GetNumEntities()).toBe(4);
    expect(entSystem.GetEntityData(3).GetComponent(TestComp2).testEntity).toBe(entSystem.GetEntityData(4));
    expect(entSystem.GetEntityData(4).GetComponent(TestComp3).testArray[0]).toBe(entSystem.GetEntityData(3));
    expect(entSystem.GetEntityData(4).GetComponent(TestComp3).nestData.nestedEntity).toBe(entSystem.GetEntityData(3));
    //Load into existing entities
    
});
