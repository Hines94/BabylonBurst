import { encode } from "@msgpack/msgpack";
import { Component } from "../EntitySystem/Component";
import { EntityData } from "../EntitySystem/EntityData";
import { EntitySaver } from "../EntitySystem/EntitySaver";
import { EntitySystem } from "../EntitySystem/EntitySystem";
import { Prefab, PrefabInstance, PrefabPackedType } from "../EntitySystem/Prefab";
import { PrefabManager } from "../EntitySystem/PrefabManager";
import { EntityLoader } from "../EntitySystem/EntityLoader";
import { RegisteredType, Saved } from "../EntitySystem/TypeRegister";

const entSystem = new EntitySystem();
const testUUID = "1234test234";

@RegisteredType(PrefabTestComp)
class PrefabTestComp extends Component {
    @Saved(String)
    testField:string = "test";
}

var prefabData:PrefabPackedType;

test("PrefabGeneratePrefab", () => {
    //generate prefab data
    const genEnt = entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(genEnt,new PrefabTestComp());
    const prefabComp = new Prefab();
    prefabComp.EntityIndex = 1;
    prefabComp.PrefabIdentifier = testUUID;
    entSystem.AddSetComponentToEntity(genEnt,prefabComp);

    const savedData = EntitySaver.GetMsgpackForAllEntities(entSystem);
    prefabData = {
        prefabID:testUUID,
        prefabData:savedData
    };
    
    PrefabManager.SetupPrefabFromRaw("test/someFile","somePrefab.Prefab",encode(prefabData));
    entSystem.ResetSystem();
});

test("PrefabReloadPrefab", () => {
    PrefabManager.LoadPrefabFromIdToNew(prefabData.prefabID,entSystem);
    expect(entSystem.GetEntitiesWithData([Prefab], []).GetNumEntities()).toBe(1);
    const ent = entSystem.GetEntityData(1);
    const prefabComp = ent.GetComponent(Prefab);
    expect(prefabComp.PrefabIdentifier).toBe(testUUID);
});

//TODO: Test where we don't save default data on nested prefabs


test("PrefabIgnoreDefault",()=>{ 
    //Add a prefab to save out and check if data is ignored (not change prefab)
    const defaultDataEnt = entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(defaultDataEnt,new PrefabTestComp());
    const prefabComp = new Prefab();
    prefabComp.EntityIndex = 2;
    prefabComp.PrefabIdentifier = testUUID;
    entSystem.AddSetComponentToEntity(defaultDataEnt,prefabComp);

    //Get a template and check that it is somewhat valid
    const savedData = EntitySaver.GetMsgpackForAllEntities(entSystem,true);
    const template = EntityLoader.GetEntityTemplateFromMsgpack(savedData);
    expect(template.DoesEntityExist(1)).toBe(true);
    expect(template.DoesEntityExist(defaultDataEnt.EntityId)).toBe(true);

    //Expect that no values have been packed for our entity as data same as default
    expect(template.GetRawComponentData(defaultDataEnt.EntityId,PrefabTestComp.name)[0]).toBe(undefined);
    expect(template.GetRawComponentData(defaultDataEnt.EntityId,PrefabTestComp.name)[1]).toBe(undefined);
})

test("PrefabSaveLoadInstance",()=>{
    entSystem.ResetSystem();
    entSystem.AddEntity();
    entSystem.AddSetComponentToEntity(1,new PrefabInstance(testUUID));
    expect(entSystem.GetEntitiesWithData([Prefab],[]).GetNumEntities()).toBe(1);
})

test("PrefabReloadChange",()=>{
    //Create entity for new prefab
    entSystem.ResetSystem();
    entSystem.AddEntity();
    const firstPrefabComp = new Prefab();
    firstPrefabComp.PrefabIdentifier = testUUID;
    firstPrefabComp.EntityIndex = 1;
    entSystem.AddSetComponentToEntity(1,firstPrefabComp);

    //Create second entity
    entSystem.AddEntity();
    const secondPrefabComp = new Prefab();
    secondPrefabComp.PrefabIdentifier = testUUID;
    secondPrefabComp.EntityIndex = 2;
    entSystem.AddSetComponentToEntity(2,secondPrefabComp);
    const testC = new PrefabTestComp();
    testC.testField = "changed";
    entSystem.AddSetComponentToEntity(2,testC);

    //Create third entity
    entSystem.AddEntity();
    const thirdPrefabComp = new Prefab();
    thirdPrefabComp.PrefabIdentifier = testUUID;
    thirdPrefabComp.EntityIndex = 3;
    entSystem.AddSetComponentToEntity(3,secondPrefabComp);

    //Save out new prefab
    const savedData = EntitySaver.GetMsgpackForAllEntities(entSystem);
    const changedPrefabData = {
        prefabID:testUUID,
        prefabData:savedData
    };

    //Reset and load
    entSystem.ResetSystem();
    const prefInstEnt = entSystem.AddEntity();
    const prefInst = new PrefabInstance(testUUID);
    entSystem.AddSetComponentToEntity(prefInstEnt,prefInst);
    expect(entSystem.GetEntitiesWithData([Prefab],[]).GetNumEntities()).toBe(1);

    //Change prefab
    PrefabManager.SetupPrefabFromRaw("test/someFile","somePrefab.Prefab",encode(changedPrefabData));

    //Event should automatically make prefabs reload
    expect(prefInst.SpawnedPrefabEntities.length).toBe(3);
    expect(prefInst.SpawnedPrefabEntities[0].EntityId).toBe(2);
    expect(prefInst.SpawnedPrefabEntities[0].GetComponent(PrefabTestComp)).toBe(undefined);
    expect(prefInst.SpawnedPrefabEntities[1].EntityId).toBe(3);
    expect(prefInst.SpawnedPrefabEntities[1].GetComponent(PrefabTestComp)).not.toBe(undefined);
    expect(prefInst.SpawnedPrefabEntities[2]).not.toBe(undefined)
})

function checkInitialPrefabLoad() {

}
