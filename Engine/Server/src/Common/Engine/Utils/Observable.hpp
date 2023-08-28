#ifndef OBSERVABLE_H
#define OBSERVABLE_H

#include <functional>
#include <vector>

template <typename... Args>
class Observable {
private:
    std::vector<std::function<void(Args...)>> listeners;

public:
    void addListener(std::function<void(Args...)> listener) {
        listeners.push_back(listener);
    }

    void removeListener(std::function<void(Args...)> listener) {
        listeners.erase(std::remove(listeners.begin(), listeners.end(), listener), listeners.end());
    }

    void triggerEvent(Args... args) {
        for (auto& listener : listeners) {
            listener(args...);
        }
    }
};

#endif // OBSERVABLE_H