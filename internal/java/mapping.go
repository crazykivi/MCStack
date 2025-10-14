package java

import (
	"strconv"
	"strings"
)

type JavaRule struct {
	McVersion string // пример "1.17"
	JavaVer   string // пример "17"
}

// Список правил в порядке от новой версии к старой
var javaRules = []JavaRule{
	{"1.20.5", "21"},
	{"1.17", "17"},
	{"1.13", "8"},
}

// CompareVersions сравнивает две версии вида "1.20.4"
// Возвращает:
//
//	> 0 если v1 > v2
//	= 0 если v1 == v2
//	< 0 если v1 < v2
func CompareVersions(v1, v2 string) int {
	parts1 := normalizeVersion(v1)
	parts2 := normalizeVersion(v2)

	for i := 0; i < len(parts1) && i < len(parts2); i++ {
		if parts1[i] > parts2[i] {
			return 1
		}
		if parts1[i] < parts2[i] {
			return -1
		}
	}

	if len(parts1) > len(parts2) {
		return 1
	}
	if len(parts1) < len(parts2) {
		return -1
	}
	return 0
}

// normalizeVersion превращает "1.20" в [1, 20, 0], "1.20.4" в [1,20,4]
func normalizeVersion(v string) []int {
	parts := strings.Split(v, ".")
	result := make([]int, 3)
	for i := 0; i < 3; i++ {
		if i < len(parts) {
			num, _ := strconv.Atoi(parts[i])
			result[i] = num
		} else {
			result[i] = 0
		}
	}
	return result
}

// GetRequiredJavaVersion возвращает версию Java (как строку: "17", "21") для данной версии Minecraft
func GetRequiredJavaVersion(mcVersion string) string {
	for _, rule := range javaRules {
		if CompareVersions(mcVersion, rule.McVersion) >= 0 {
			return rule.JavaVer
		}
	}
	// fallback: Java 8 для очень старых версий
	return "8"
}
