#include "PerfTracking.h"
#include "Utils/Settings.h"
#include <chrono>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>

PerfTracking::PerfTracking()
    //Init list
    : exposer{"127.0.0.1:8081"},
      promReg{std::make_shared<prometheus::Registry>()},
      uptimeCounter{prometheus::BuildCounter()
                        .Name("time_running_seconds_total")
                        .Help("How long the program has been running.")
                        .Register(*promReg)
                        .Add({})},
      framerate{prometheus::BuildGauge()
                    .Name("current_framerate")
                    .Help("1/Delta Time")
                    .Register(*promReg)
                    .Add({})},
      playerNumber{prometheus::BuildGauge()
                       .Name("player_number")
                       .Help("How many active players do we have?")
                       .Register(*promReg)
                       .Add({})},
      dataOut{prometheus::BuildGauge()
                  .Name("DataSendBytes")
                  .Help("How much data is out per frame?")
                  .Register(*promReg)
                  .Add({})},
      cpuUseage{prometheus::BuildGauge()
                    .Name("CpuUse")
                    .Help("Ammt of cpu used / uptime")
                    .Register(*promReg)
                    .Add({})},
      systemsGage{prometheus::BuildGauge()
                      .Name("EntitySystem")
                      .Help("All current active entity systems")
                      .Register(*promReg)},
      tasksGage{prometheus::BuildGauge()
                    .Name("ParallelTasks")
                    .Help("All parallel tasks running")
                    .Register(*promReg)},
      memoryGage{prometheus::BuildGauge()
                     .Name("MemoryUseage")
                     .Help("Menory used by the server process")
                     .Register(*promReg)}

{
    // constructor body
    exposer.RegisterCollectable(promReg);
    //Setup performance monitoring
    MonitoringThread = std::thread(&PerfTracking::performanceMonitor, this);
    std::cout << "Prometheus vals ready on port 8081" << std::endl;
}

PerfTracking::~PerfTracking() {
    stopThread = true;
    if (MonitoringThread.joinable()) {
        MonitoringThread.join();
    }
}

void PerfTracking::UpdateDeltaTime(double dt) {
    this->uptimeCounter.Increment(dt);
    this->framerate.Set(double(1) / dt);
}

void PerfTracking::UpdateDataOut(uint dataSize) {
    dataOut.Set(dataSize / Settings::getInstance().networkingUpdateFreq);
}

void PerfTracking::IncrementActivePlayers() {
    playerNumber.Increment(1);
}

void PerfTracking::DecrementActivePlayers() {
    playerNumber.Decrement(1);
}

void PerfTracking::UpdateSystemDeltaTime(std::string systemName, double systemTime) {
    auto& new_metric = systemsGage.Add({{"SystemName", systemName}});
    new_metric.Set(systemTime);
}

void PerfTracking::UpdateTaskDeltaTime(std::string taskName, double taskTime) {
    auto& new_metric = tasksGage.Add({{"SystemName", taskName}});
    new_metric.Set(taskTime);
}

//----------------------- Perf Monitoring -----------------------------

void PerfTracking::updateMemoryUseage() {
    std::ifstream file("/proc/self/status");
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("VmSize") != std::string::npos || line.find("VmPeak") != std::string::npos || line.find("VmRSS") != std::string::npos || line.find("VmSwap") != std::string::npos) {

            std::string delimiter = ":";
            std::string key = line.substr(0, line.find(delimiter));

            //Extract numbers
            std::vector<int> numbers;
            std::string temp;

            for (char ch : line) {
                if (std::isdigit(ch)) {
                    temp += ch;
                }
            }

            // Convert to bytes
            int bytes = std::stoi(temp) * 1024;

            auto memoryName = "Memory Size";
            if (key == "VmPeak") {
                memoryName = "Memory Peak";
            } else if (key == "VmRSS") {
                memoryName = "Memory Resident Set Size";
            } else if (key == "VmSwap") {
                memoryName = "Memory Swap (disk overflow)";
            }

            auto& new_metric = memoryGage.Add({{"MemoryType", memoryName}});
            new_metric.Set(bytes);
        }
    }
}

unsigned long get_cpu_total_time() {
    std::ifstream file("/proc/stat");
    std::string line;
    std::getline(file, line);
    std::istringstream iss(line);
    std::string cpu;
    unsigned long user, nice, system, idle;
    iss >> cpu >> user >> nice >> system >> idle;
    return user + nice + system + idle;
}

unsigned long get_cpu_time() {
    std::ifstream file("/proc/self/stat");
    std::string line;
    std::getline(file, line);
    std::istringstream iss(line);
    std::string pid, comm, state, ppid, pgrp, session, tty_nr;
    std::string tpgid, flags, minflt, cminflt, majflt, cmajflt;
    unsigned long utime, stime, cutime, cstime;
    iss >> pid >> comm >> state >> ppid >> pgrp >> session >> tty_nr >> tpgid >> flags >> minflt >> cminflt >> majflt >> cmajflt >> utime >> stime >> cutime >> cstime;
    return utime + stime;
}

void PerfTracking::performanceMonitor() {
    while (!stopThread) {
        //Track CPU stats at start of check
        unsigned long prev_process_cpu = get_cpu_time();
        unsigned long prev_total_cpu = get_cpu_total_time();

        //Only track once per sec
        std::this_thread::sleep_for(std::chrono::seconds(1));

        //Diff from start of second to get stats
        unsigned long process_cpu = get_cpu_time();
        unsigned long total_cpu = get_cpu_total_time();
        unsigned long process_diff = process_cpu - prev_process_cpu;
        unsigned long total_diff = total_cpu - prev_total_cpu;
        double cpu_usage = static_cast<double>(process_diff) / static_cast<double>(total_diff);
        cpu_usage *= 100;
        cpuUseage.Set(cpu_usage);

        //Track memory
        updateMemoryUseage();
    }
}