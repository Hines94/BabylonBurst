#include "Engine/Utils/VisualMessageShower.h"
#include <iostream>

namespace VisualMessageShower {
    Observable<std::string, float> RequestVisibleErrorMessageShow;
    Observable<std::string, float> RequestVisibleInfoMessageShow;
} // namespace VisualMessageShower

void VisualMessageShower::ShowVisibleErrorMessage(std::string message, float time) {
    std::cerr << "ERROR: " << message << std::endl;
}

void VisualMessageShower::ShowVisibleInfoMessage(std::string message, float time) {
    std::cout << message << std::endl;
}

void VisualMessageShower::ShowVisibleErrorMessageIfEditor(std::string message, float time) {
    return;
}

void VisualMessageShower::ShowVisibleInfoMessageIfEditor(std::string message, float time) {
    return;
}