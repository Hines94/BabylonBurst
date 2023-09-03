#include "Engine/Utils/VisualMessageShower.h"
#include <iostream>

namespace VisualMessageShower {
    Observable<std::string, float> RequestVisibleErrorMessageShow;
    Observable<std::string, float> RequestVisibleInfoMessageShow;
}

void VisualMessageShower::ShowVisibleErrorMessageIfEditor(std::string message,float time)  {
    std::cout << "TODO: Check if Editor" << std::endl;
    ShowVisibleErrorMessage(message,time);
}

void VisualMessageShower::ShowVisibleInfoMessageIfEditor(std::string message,float time)  {
    std::cout << "TODO: Check if Editor" << std::endl;
    ShowVisibleInfoMessage(message,time);
}

void VisualMessageShower::ShowVisibleErrorMessage(std::string message,float time) {
    if(VisualMessageShower::RequestVisibleErrorMessageShow.HasListeners()) {
        VisualMessageShower::RequestVisibleErrorMessageShow.triggerEvent(message,time);
    } else {
        std::cerr << "ERROR: " << message << std::endl;
    }
}

void VisualMessageShower::ShowVisibleInfoMessage(std::string message,float time) {
    if(VisualMessageShower::RequestVisibleInfoMessageShow.HasListeners()) {
        VisualMessageShower::RequestVisibleInfoMessageShow.triggerEvent(message,time);
    } else {
        std::cout << message << std::endl;
    }
}