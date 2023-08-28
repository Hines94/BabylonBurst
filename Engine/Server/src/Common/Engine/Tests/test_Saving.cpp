#include "Engine/Entities/Core/EntTransform.h"
#include "Engine/SaveLoad/EntityLoader.h"
#include "Engine/SaveLoad/EntitySaver.h"
#include "gtest/gtest.h"
#include <iostream>
#include <msgpack.hpp>
#include <nlohmann/json.hpp>
#include <string>

std::string TestLoad = R"({"0":146,"1":130,"2":161,"3":79,"4":2,"5":161,"6":67,"7":133,"8":161,"9":50,"10":131,"11":161,"12":48,"13":131,"14":161,"15":88,"16":0,"17":161,"18":89,"19":0,"20":161,"21":90,"22":0,"23":161,"24":49,"25":132,"26":161,"27":87,"28":1,"29":161,"30":88,"31":0,"32":161,"33":89,"34":0,"35":161,"36":90,"37":0,"38":161,"39":50,"40":131,"41":161,"42":88,"43":1,"44":161,"45":89,"46":1,"47":161,"48":90,"49":1,"50":161,"51":51,"52":130,"53":161,"54":48,"55":175,"56":100,"57":101,"58":98,"59":117,"60":103,"61":47,"62":84,"63":101,"64":115,"65":116,"66":72,"67":117,"68":109,"69":97,"70":110,"71":161,"72":49,"73":169,"74":84,"75":101,"76":115,"77":116,"78":72,"79":117,"80":109,"81":97,"82":110,"83":161,"84":57,"85":129,"86":161,"87":48,"88":1,"89":162,"90":49,"91":48,"92":129,"93":161,"94":48,"95":145,"96":2,"97":162,"98":49,"99":49,"100":129,"101":161,"102":48,"103":145,"104":2,"105":130,"106":161,"107":79,"108":1,"109":161,"110":67,"111":129,"112":161,"113":48,"114":131,"115":161,"116":48,"117":180,"118":118,"119":109,"120":112,"121":104,"122":112,"123":51,"124":89,"125":68,"126":115,"127":48,"128":81,"129":71,"130":101,"131":67,"132":89,"133":85,"134":115,"135":82,"136":105,"137":53,"138":161,"139":49,"140":2,"141":161,"142":50,"143":2})";
std::string TestTypes = R"({"0":156,"1":146,"2":176,"3":80,"4":108,"5":97,"6":121,"7":101,"8":114,"9":67,"10":111,"11":110,"12":116,"13":114,"14":111,"15":108,"16":108,"17":101,"18":114,"19":147,"20":170,"21":80,"22":108,"23":97,"24":121,"25":101,"26":114,"27":117,"28":117,"29":105,"30":100,"31":174,"32":67,"33":111,"34":110,"35":116,"36":114,"37":111,"38":108,"39":108,"40":101,"41":100,"42":80,"43":97,"44":119,"45":110,"46":184,"47":67,"48":117,"49":114,"50":114,"51":101,"52":110,"53":116,"54":67,"55":111,"56":110,"57":116,"58":114,"59":111,"60":108,"61":108,"62":105,"63":110,"64":103,"65":69,"66":110,"67":116,"68":105,"69":116,"70":121,"71":146,"72":170,"73":80,"74":108,"75":97,"76":121,"77":101,"78":114,"79":80,"80":97,"81":119,"82":110,"83":144,"84":146,"85":172,"86":69,"87":110,"88":116,"89":84,"90":114,"91":97,"92":110,"93":115,"94":102,"95":111,"96":114,"97":109,"98":147,"99":168,"100":80,"101":111,"102":115,"103":105,"104":116,"105":105,"106":111,"107":110,"108":168,"109":82,"110":111,"111":116,"112":97,"113":116,"114":105,"115":111,"116":110,"117":165,"118":83,"119":99,"120":97,"121":108,"122":101,"123":146,"124":175,"125":73,"126":110,"127":115,"128":116,"129":97,"130":110,"131":99,"132":101,"133":100,"134":82,"135":101,"136":110,"137":100,"138":101,"139":114,"140":147,"141":167,"142":65,"143":119,"144":115,"145":80,"146":97,"147":116,"148":104,"149":168,"150":77,"151":101,"152":115,"153":104,"154":78,"155":97,"156":109,"157":101,"158":169,"159":76,"160":97,"161":121,"162":101,"163":114,"164":77,"165":97,"166":115,"167":107,"168":146,"169":175,"170":67,"171":97,"172":112,"173":115,"174":117,"175":108,"176":101,"177":67,"178":111,"179":108,"180":108,"181":105,"182":100,"183":101,"184":114,"185":146,"186":166,"187":72,"188":101,"189":105,"190":103,"191":104,"192":116,"193":165,"194":87,"195":105,"196":100,"197":116,"198":104,"199":146,"200":169,"201":82,"202":105,"203":103,"204":105,"205":100,"206":66,"207":111,"208":100,"209":121,"210":145,"211":164,"212":77,"213":97,"214":115,"215":115,"216":146,"217":174,"218":68,"219":105,"220":114,"221":116,"222":121,"223":82,"224":105,"225":103,"226":105,"227":100,"228":66,"229":111,"230":100,"231":121,"232":144,"233":146,"234":174,"235":82,"236":111,"237":116,"238":97,"239":116,"240":105,"241":111,"242":110,"243":69,"244":110,"245":103,"246":105,"247":110,"248":101,"249":147,"250":167,"251":69,"252":110,"253":97,"254":98,"255":108,"256":101,"257":100,"258":173,"259":82,"260":111,"261":116,"262":97,"263":116,"264":105,"265":111,"266":110,"267":80,"268":111,"269":119,"270":101,"271":114,"272":179,"273":83,"274":116,"275":97,"276":98,"277":105,"278":108,"279":105,"280":116,"281":121,"282":77,"283":117,"284":108,"285":116,"286":105,"287":112,"288":108,"289":105,"290":101,"291":114,"292":146,"293":177,"294":76,"295":105,"296":110,"297":101,"298":97,"299":114,"300":70,"301":111,"302":114,"303":99,"304":101,"305":69,"306":110,"307":103,"308":105,"309":110,"310":101,"311":145,"312":167,"313":69,"314":110,"315":97,"316":98,"317":108,"318":101,"319":100,"320":146,"321":178,"322":67,"323":111,"324":110,"325":116,"326":114,"327":111,"328":108,"329":108,"330":97,"331":98,"332":108,"333":101,"334":69,"335":110,"336":116,"337":105,"338":116,"339":121,"340":145,"341":177,"342":67,"343":117,"344":114,"345":114,"346":101,"347":110,"348":116,"349":67,"350":111,"351":110,"352":116,"353":114,"354":111,"355":108,"356":108,"357":101,"358":114,"359":146,"360":179,"361":67,"362":111,"363":110,"364":116,"365":114,"366":111,"367":108,"368":108,"369":97,"370":98,"371":108,"372":101,"373":82,"374":111,"375":116,"376":97,"377":116,"378":111,"379":114,"380":145,"381":180,"382":67,"383":111,"384":110,"385":116,"386":114,"387":111,"388":108,"389":108,"390":97,"391":98,"392":108,"393":101,"394":82,"395":111,"396":116,"397":97,"398":116,"399":111,"400":114,"401":115,"402":146,"403":177,"404":67,"405":111,"406":110,"407":116,"408":114,"409":111,"410":108,"411":108,"412":97,"413":98,"414":108,"415":101,"416":77,"417":111,"418":118,"419":101,"420":114,"421":145,"422":185,"423":67,"424":111,"425":110,"426":116,"427":114,"428":111,"429":108,"430":108,"431":97,"432":98,"433":108,"434":101,"435":70,"436":111,"437":114,"438":99,"439":101,"440":65,"441":112,"442":112,"443":108,"444":105,"445":101,"446":114,"447":115})";

std::vector<std::pair<std::string, std::vector<std::string>>> loadedTypes;

//Load types from a presaved string
TEST(SavingLoadingTests, LoadTypesPresaved) {
    EntityComponentSystem::ResetEntitySystem();
    // Parse the JSON string
    nlohmann::json json = nlohmann::json::parse(TestTypes);

    // Initialize a vector to hold the byte array
    std::vector<uint8_t> byte_array;

    // Populate the vector with the byte values from the JSON
    for (size_t i = 0; i < json.size(); ++i) {
        byte_array.push_back(static_cast<uint8_t>(json[std::to_string(i)]));
    }

    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(byte_array.data()), byte_array.size());
    loadedTypes = EntityLoader::GetNumerisedComponentKeys(oh.get());

    EXPECT_EQ(loadedTypes.size(), 12);
    EXPECT_EQ(loadedTypes[0].first, "PlayerController");
    EXPECT_EQ(loadedTypes[0].second.size(), 3);
    EXPECT_EQ(loadedTypes[0].second[0], "Playeruuid");
    EXPECT_EQ(loadedTypes[5].first, "RigidBody");
    EXPECT_EQ(loadedTypes[5].second.size(), 1);
    EXPECT_EQ(loadedTypes[11].first, "ControllableMover");
}

//Load in Ents from a presaved string
TEST(SavingLoadingTests, LoadEntsFromPresaved) {
    // Parse the JSON string
    nlohmann::json json = nlohmann::json::parse(TestLoad);

    // Initialize a vector to hold the byte array
    std::vector<uint8_t> byte_array;

    // Populate the vector with the byte values from the JSON
    for (size_t i = 0; i < json.size(); ++i) {
        byte_array.push_back(static_cast<uint8_t>(json[std::to_string(i)]));
    }

    //Load entities template
    msgpack::object_handle oh = msgpack::unpack(reinterpret_cast<const char*>(byte_array.data()), byte_array.size());
    auto entitiesTemplate = EntityLoader::GetTemplateFromMsgpackFormat(loadedTypes, oh.get());

    //Check load is correct
    EXPECT_EQ(entitiesTemplate.get()->templatedEntities.size(), 2);
    EXPECT_NE(entitiesTemplate.get()->templatedEntities.find(1), entitiesTemplate.get()->templatedEntities.end());
    EXPECT_EQ(entitiesTemplate.get()->templatedEntities[1].size(), 1);

    //Populate Entities
    auto entMap = EntityLoader::LoadTemplateToNewEntities(entitiesTemplate);
    //Check entities exist
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 2);
    //Check component data has been set
    EXPECT_EQ(EntityComponentSystem::HasComponent<EntTransform>(entMap.find(2)->second), true);
}

TEST(SavingLoadingTests, LoadEntsFromFreshSave) {
    //Create some new entities
    EntityComponentSystem::ResetEntitySystem();
    auto newEnt = EntityComponentSystem::AddEntity();
    auto newEnt2 = EntityComponentSystem::AddEntity();
    auto fakeTransform = new EntTransform();
    fakeTransform->Position.X = 5;
    EntityComponentSystem::AddSetComponentToEntity(newEnt2, fakeTransform);
    EntityComponentSystem::FlushEntitySystem();
    //Save out
    auto save = EntitySaver::GetFullSavePack();
    //Reset to load from clean
    EntityComponentSystem::ResetEntitySystem();
    //Load template
    std::vector<uint8_t> vec(save->data(), save->data() + save->size());
    auto saveTemplate = EntityLoader::LoadTemplateFromSave(vec);
    //Check template
    EXPECT_EQ(saveTemplate.get()->templatedEntities.size(), 2);
    EXPECT_EQ(saveTemplate.get()->templatedEntities.find(1)->second.size(), 0);
    //Populate world
    EntityLoader::LoadTemplateToNewEntities(saveTemplate);
    // //Check load correct
    EXPECT_EQ(EntityComponentSystem::GetNumberEntitiesSpawned(), 2);
    auto firstEnt = EntityComponentSystem::GetComponentDataForEntity(1);
    auto secondEnt = EntityComponentSystem::GetComponentDataForEntity(2);
    EXPECT_EQ(EntityComponentSystem::HasComponent<EntTransform>(secondEnt), true);
    EXPECT_EQ(EntityComponentSystem::GetComponent<EntTransform>(secondEnt)->Position.X, 5);
}

TEST(SavingLoadingTests, IgnoreDefaultValues) {
    EntityComponentSystem::ResetEntitySystem();
    const auto newEnt = EntityComponentSystem::AddEntity();
    EntityComponentSystem::AddSetComponentToEntity(newEnt, new EntTransform());
    EntityComponentSystem::FlushEntitySystem();

    auto save = EntitySaver::GetFullSavePack();
    std::vector<uint8_t> vec(save->data(), save->data() + save->size());
    auto saveTemplate = EntityLoader::LoadTemplateFromSave(vec);
    EXPECT_EQ(saveTemplate.get()->EntityExists(newEnt->owningEntity), true);
    EXPECT_EQ(saveTemplate.get()->ComponentExists(newEnt->owningEntity, "EntTransform"), true);
    EXPECT_EQ(saveTemplate.get()->ParameterExists(newEnt->owningEntity, "EntTransform", "Position"), false);
}