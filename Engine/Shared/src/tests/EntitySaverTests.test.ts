import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntityLoader } from "../EntitySystem/EntityLoader";
import { EntitySaver } from "../EntitySystem/EntitySaver";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

@RegisteredType(TestSaveComp)
class TestSaveComp extends Component {
    @Saved(String)
    data:string = "test";
}

@RegisteredType(TestSaveComp2)
class TestSaveComp2 extends Component {
    data = "testComp2";
    @Saved(Number)
    otherdata:number = 1;
    @Saved(EntityData)
    testEntity:EntityData;
}

@RegisteredType(nestedData)
class nestedData {
    @Saved(EntityData)
    nestedEntity:EntityData;
}

@RegisteredType(TestSaveComp3)
class TestSaveComp3 extends Component {
    @Saved(String)
    data:string = "testComp3";
    @Saved(nestedData)
    nestData:nestedData = new nestedData();
    @Saved(EntityData)
    testArray:EntityData[] = [];
}

const entSystem = new EntitySystem();


test("EntitySystemSaveAllEntities", () => {
    const newent = entSystem.AddEntity();
    const newTestC = new TestSaveComp();
    newTestC.data = "changed";
    entSystem.AddSetComponentToEntity(newent, newTestC);
    const newTestC2 = new TestSaveComp2();
    newTestC2.data = "changedData";
    newTestC2.otherdata = 5
    entSystem.AddSetComponentToEntity(newent,newTestC2);
    const newent2 = entSystem.AddEntity();
    newTestC2.testEntity = newent2;
    entSystem.AddSetComponentToEntity(newent2,new TestSaveComp());
    const testComp3 = new TestSaveComp3();
    testComp3.data = "SAVED_DATA";
    testComp3.nestData.nestedEntity = newent;
    testComp3.testArray.push(newent);
    entSystem.AddSetComponentToEntity(newent2,testComp3);

    const save = EntitySaver.GetMsgpackForAllEntities(entSystem); 

    //Get template
    const reloadTemplate = EntityLoader.GetEntityTemplateFromMsgpack(save);
    expect(reloadTemplate.DoesEntityExist(1)).toBe(true);
    expect(reloadTemplate.DoesEntityExist(3)).toBe(false);
    expect(reloadTemplate.GetRawComponentData(1,TestSaveComp2.name)[1]).toBe(2);
    const testComp = reloadTemplate.GetEntityComponent(1,TestSaveComp,undefined,{});
    expect(testComp.data).toBe("changed");
    expect(reloadTemplate.GetEntityComponent(1,TestSaveComp2,undefined,{}).data).toBe("testComp2");
    expect(reloadTemplate.GetEntityComponent(1,TestSaveComp2,undefined,{}).otherdata).toBe(5);
    expect(reloadTemplate.GetEntityComponent(2,TestSaveComp2,undefined,{})).toBe(undefined);

    //Load ents into new entities
    EntityLoader.LoadTemplateIntoNewEntities(reloadTemplate,entSystem);
    expect(entSystem.GetEntitiesWithData([TestSaveComp],[]).GetNumEntities()).toBe(4);
    expect(entSystem.GetEntityData(3).GetComponent(TestSaveComp2).testEntity).toBe(entSystem.GetEntityData(4));
    expect(entSystem.GetEntityData(4).GetComponent(TestSaveComp3).testArray[0]).toBe(entSystem.GetEntityData(3));
    expect(entSystem.GetEntityData(4).GetComponent(TestSaveComp3).nestData.nestedEntity).toBe(entSystem.GetEntityData(3));

    //Load into existing entities
    entSystem.GetEntityData(4).GetComponent(TestSaveComp3).data = "SHOULD_BE_RELOADED";
    EntityLoader.LoadTemplateIntoExistingEntities(reloadTemplate,entSystem);
    expect(entSystem.GetEntityData(2).GetComponent(TestSaveComp3).data).toBe("SAVED_DATA");

});
