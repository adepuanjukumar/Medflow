#include <iostream>
#include <string>
#include <cmath>

using namespace std;

// Convert HH:MM to minutes
int timeToMinutes(const string& t) {
    if (t.length() != 5 || t[2] != ':') return 0;
    int h = stoi(t.substr(0, 2));
    int m = stoi(t.substr(3, 2));
    return h * 60 + m;
}

int main(int argc, char* argv[]) {
    // We expect exactly two arguments (excluding program name) e.g., check 08:00 10:00
    if (argc != 3) {
        cout << "error: need two times in HH:MM format" << endl;
        return 1;
    }
    
    int t1 = timeToMinutes(argv[1]);
    int t2 = timeToMinutes(argv[2]);
    
    // Absolute difference in minutes
    int diff = abs(t1 - t2);
    
    // If difference is less than 2 hours (120 minutes), it's unsafe.
    if (diff < 120) {
        cout << "unsafe" << endl;
    } else {
        cout << "safe" << endl;
    }
    return 0;
}
