#include <iostream>

namespace TestRego {
    class Registrar {
    public:
        Registrar(int msgId) {
            std::cout << "TEST: " << msgId << std::endl;
        }
    };

    void testFunc();
}; // namespace TestRego

#define REGISTER_TEST(MsgId) static TestRego::Registrar _testRego_##MsgId(MsgId);

REGISTER_TEST(2)