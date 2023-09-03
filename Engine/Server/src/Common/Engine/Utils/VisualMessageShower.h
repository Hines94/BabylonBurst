#pragma once
#include "Engine/Utils/Observable.hpp"
#include <string>

namespace VisualMessageShower {
    void ShowVisibleErrorMessageIfEditor(std::string message, float time = 3000);
    void ShowVisibleInfoMessageIfEditor(std::string message, float time = 3000);

    void ShowVisibleErrorMessage(std::string message, float time = 3000);
    void ShowVisibleInfoMessage(std::string message, float time = 3000);

    extern Observable<std::string, float> RequestVisibleErrorMessageShow;
    extern Observable<std::string, float> RequestVisibleInfoMessageShow;
} // namespace VisualMessageShower