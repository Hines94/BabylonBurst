#pragma once
#include <string>
#include "Engine/Utils/Observable.hpp"

namespace VisualMessageShower {
    void ShowVisibleErrorMessageIfEditor(std::string message,float time = 3000);
    void ShowVisibleInfoMessageIfEditor(std::string message,float time = 3000);
    
    void ShowVisibleErrorMessage(std::string message,float time = 3000);
    void ShowVisibleInfoMessage(std::string message,float time = 3000);

    extern Observable<std::string, float> RequestVisibleErrorMessageShow;
    extern Observable<std::string, float> RequestVisibleInfoMessageShow;
}