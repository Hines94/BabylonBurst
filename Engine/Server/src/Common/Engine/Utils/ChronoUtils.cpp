#include "ChronoUtils.h"
#include <chrono>

double ChronoUtils::get_time_since_epoch() {
    auto now = std::chrono::system_clock::now().time_since_epoch();
    auto now_as_seconds = std::chrono::duration_cast<std::chrono::duration<double>>(now);
    return now_as_seconds.count();
}
