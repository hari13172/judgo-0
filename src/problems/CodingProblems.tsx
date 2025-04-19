export interface TestCase {
    id: number
    arguments: string
    expectedOutput: string
    isHidden?: boolean
    isLocked?: boolean
}

export interface Problem {
    id: string
    title: string
    description: string
    difficulty: "Easy" | "Medium" | "Hard"
    constraints: string[]
    cliExplanation: string
    stdoutExplanation: string
    examples: { input: string; output: string }[]
    testCases: TestCase[]
    starterCode: {
        [key: number]: string // language_id -> starter code
    }
    tags: string[]
}

export const codingProblems: Problem[] = [
    // Problem 1: String Reverse
    {
        id: "string-reverse",
        title: "String Reverse",
        difficulty: "Easy",
        description:
            "Write a function that reverses a string. The input string is given as a string. Return the reversed string.",
        constraints: ["1 <= string length <= 10^5", "The string contains only printable ASCII characters."],
        cliExplanation: "The input is a single string to be reversed.",
        stdoutExplanation: "The reversed string.",
        examples: [
            {
                input: "hello",
                output: "olleh",
            },
            {
                input: "world",
                output: "dlrow",
            },
        ],
        testCases: [
            {
                id: 1,
                arguments: "hello",
                expectedOutput: "olleh",
                isHidden: false,
            },
            {
                id: 2,
                arguments: "world",
                expectedOutput: "dlrow",
                isHidden: false,
            },
            {
                id: 3,
                arguments: "a",
                expectedOutput: "a",
                isHidden: false,
            },
            {
                id: 4,
                arguments: "",
                expectedOutput: "",
                isHidden: false,
            },
            {
                id: 5,
                arguments: "racecar",
                expectedOutput: "racecar",
                isHidden: false,
            },
            {
                id: 6,
                arguments: "A man, a plan, a canal: Panama",
                expectedOutput: "amanaP :lanac a ,nalp a ,nam A",
                isHidden: true,
                isLocked: true,
            },
            {
                id: 7,
                arguments: "12345",
                expectedOutput: "54321",
                isHidden: true,
                isLocked: true,
            },
        ],
        starterCode: {
            71: `import sys
  
  def reverse_string(s):
      # Write your code here
      pass
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      input_string = sys.argv[1]
      result = reverse_string(input_string)
      print(result)
  else:
      print("No arguments provided.")
  `,
            63: `function reverseString(s) {
      // Write your code here
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const inputString = args[0];
      const result = reverseString(inputString);
      console.log(result);
  } else {
      console.log("No arguments provided.");
  }
  `,
            54: `#include <iostream>
  #include <string>
  
  using namespace std;
  
  string reverseString(string s) {
      // Write your code here
      return "";
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          string input = argv[1];
          cout << reverseString(input) << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }
  `,
            62: `import java.util.Scanner;
  
  public class Main {
      public static String reverseString(String s) {
          // Write your code here
          return "";
      }
      
      public static void main(String[] args) {
          if (args.length > 0) {
              String input = args[0];
              System.out.println(reverseString(input));
          } else {
              System.out.println("No arguments provided.");
          }
      }
  }
  `,
        },
        tags: ["string", "two-pointers", "algorithms"],
    },

    // Problem 2: Palindrome Check
    {
        id: "palindrome-check",
        title: "Palindrome Check",
        difficulty: "Easy",
        description:
            "Write a function that checks if a given string is a palindrome. A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward, ignoring spaces, punctuation, and capitalization.",
        constraints: [
            "1 <= string length <= 10^5",
            "The string contains printable ASCII characters.",
            "Empty strings are considered palindromes.",
        ],
        cliExplanation: "The input is a single string to check for palindrome property.",
        stdoutExplanation: "Return 'true' if the string is a palindrome, 'false' otherwise.",
        examples: [
            {
                input: "racecar",
                output: "true",
            },
            {
                input: "hello",
                output: "false",
            },
        ],
        testCases: [
            {
                id: 1,
                arguments: "racecar",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 2,
                arguments: "hello",
                expectedOutput: "false",
                isHidden: false,
            },
            {
                id: 3,
                arguments: "A man, a plan, a canal: Panama",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 4,
                arguments: "",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 5,
                arguments: "race a car",
                expectedOutput: "false",
                isHidden: false,
            },
            {
                id: 6,
                arguments: "No 'x' in Nixon",
                expectedOutput: "true",
                isHidden: true,
                isLocked: true,
            },
            {
                id: 7,
                arguments: "12321",
                expectedOutput: "true",
                isHidden: true,
                isLocked: true,
            },
        ],
        starterCode: {
            71: `import sys
  import re
  
  def is_palindrome(s):
      # Write your code here
      pass
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      input_string = sys.argv[1]
      result = is_palindrome(input_string)
      print(str(result).lower())
  else:
      print("No arguments provided.")
  `,
            63: `function isPalindrome(s) {
      // Write your code here
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const inputString = args[0];
      const result = isPalindrome(inputString);
      console.log(result.toString());
  } else {
      console.log("No arguments provided.");
  }
  `,
            54: `#include <iostream>
  #include <string>
  #include <cctype>
  #include <algorithm>
  
  using namespace std;
  
  bool isPalindrome(string s) {
      // Write your code here
      return false;
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          string input = argv[1];
          cout << (isPalindrome(input) ? "true" : "false") << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }
  `,
        },
        tags: ["string", "two-pointers", "algorithms"],
    },

    // Problem 3: FizzBuzz
    {
        id: "fizz-buzz",
        title: "FizzBuzz",
        difficulty: "Easy",
        description:
            "Write a function that returns the FizzBuzz sequence up to n. For each number from 1 to n: if the number is divisible by 3, output 'Fizz'; if the number is divisible by 5, output 'Buzz'; if the number is divisible by both 3 and 5, output 'FizzBuzz'; otherwise, output the number itself.",
        constraints: ["1 <= n <= 100"],
        cliExplanation: "The input is a single integer n.",
        stdoutExplanation:
            "Return a string with the FizzBuzz sequence up to n, with each element separated by a comma and a space.",
        examples: [
            {
                input: "5",
                output: "1, 2, Fizz, 4, Buzz",
            },
            {
                input: "15",
                output: "1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz",
            },
        ],
        testCases: [
            {
                id: 1,
                arguments: "5",
                expectedOutput: "1, 2, Fizz, 4, Buzz",
                isHidden: false,
            },
            {
                id: 2,
                arguments: "15",
                expectedOutput: "1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz",
                isHidden: false,
            },
            {
                id: 3,
                arguments: "1",
                expectedOutput: "1",
                isHidden: false,
            },
            {
                id: 4,
                arguments: "3",
                expectedOutput: "1, 2, Fizz",
                isHidden: false,
            },
            {
                id: 5,
                arguments: "30",
                expectedOutput:
                    "1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz, 16, 17, Fizz, 19, Buzz, Fizz, 22, 23, Fizz, Buzz, 26, Fizz, 28, 29, FizzBuzz",
                isHidden: true,
                isLocked: true,
            },
        ],
        starterCode: {
            71: `import sys
  
  def fizz_buzz(n):
      # Write your code here
      pass
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      n = int(sys.argv[1])
      result = fizz_buzz(n)
      print(result)
  else:
      print("No arguments provided.")
  `,
            63: `function fizzBuzz(n) {
      // Write your code here
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const n = parseInt(args[0]);
      const result = fizzBuzz(n);
      console.log(result);
  } else {
      console.log("No arguments provided.");
  }
  `,
            54: `#include <iostream>
  #include <string>
  #include <vector>
  
  using namespace std;
  
  string fizzBuzz(int n) {
      // Write your code here
      return "";
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          int n = stoi(argv[1]);
          cout << fizzBuzz(n) << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }
  `,
        },
        tags: ["math", "string", "simulation"],
    },

    // Problem 4: Two Sum
    {
        id: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        description:
            "Given an array of integers and a target sum, find the indices of two numbers in the array that add up to the target sum. You may assume that each input has exactly one solution, and you may not use the same element twice.",
        constraints: [
            "2 <= array length <= 10^4",
            "-10^9 <= array[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists.",
        ],
        cliExplanation: "The input consists of a target sum followed by an array of integers separated by spaces.",
        stdoutExplanation:
            "Return the indices of the two numbers that add up to the target sum, in ascending order, separated by a comma and a space.",
        examples: [
            {
                input: "9 2 7 11 15",
                output: "0, 1",
            },
            {
                input: "6 3 2 4",
                output: "1, 2",
            },
        ],
        testCases: [
            {
                id: 1,
                arguments: "9 2 7 11 15",
                expectedOutput: "0, 1",
                isHidden: false,
            },
            {
                id: 2,
                arguments: "6 3 2 4",
                expectedOutput: "1, 2",
                isHidden: false,
            },
            {
                id: 3,
                arguments: "6 3 3",
                expectedOutput: "0, 1",
                isHidden: false,
            },
            {
                id: 4,
                arguments: "10 -1 -2 -3 -4 -5 -6 -7 -8 -9 -10",
                expectedOutput: "0, 9",
                isHidden: false,
            },
            {
                id: 5,
                arguments: "0 0 0",
                expectedOutput: "0, 1",
                isHidden: true,
                isLocked: true,
            },
            {
                id: 6,
                arguments: "-8 -4 -4",
                expectedOutput: "1, 2",
                isHidden: true,
                isLocked: true,
            },
        ],
        starterCode: {
            71: `import sys
  
  def two_sum(nums, target):
      # Write your code here
      pass
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      args = sys.argv[1].split()
      target = int(args[0])
      nums = [int(x) for x in args[1:]]
      result = two_sum(nums, target)
      print(f"{result[0]}, {result[1]}")
  else:
      print("No arguments provided.")
  `,
            63: `function twoSum(nums, target) {
      // Write your code here
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const allArgs = args[0].split(' ');
      const target = parseInt(allArgs[0]);
      const nums = allArgs.slice(1).map(Number);
      const result = twoSum(nums, target);
      console.log(\`\${result[0]}, \${result[1]}\`);
  } else {
      console.log("No arguments provided.");
  }
  `,
            54: `#include <iostream>
  #include <vector>
  #include <string>
  #include <sstream>
  #include <unordered_map>
  
  using namespace std;
  
  vector<int> twoSum(vector<int>& nums, int target) {
      // Write your code here
      return {0, 0};
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          string arg = argv[1];
          stringstream ss(arg);
          int target;
          ss >> target;
          
          vector<int> nums;
          int num;
          while (ss >> num) {
              nums.push_back(num);
          }
          
          vector<int> result = twoSum(nums, target);
          cout << result[0] << ", " << result[1] << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }
  `,
        },
        tags: ["array", "hash-table", "algorithms"],
    },

    // Problem 5: Valid Anagram
    {
        id: "valid-anagram",
        title: "Valid Anagram",
        difficulty: "Easy",
        description:
            "Given two strings s and t, determine if t is an anagram of s. An anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
        constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
        cliExplanation: "The input consists of two strings separated by a space.",
        stdoutExplanation: "Return 'true' if t is an anagram of s, 'false' otherwise.",
        examples: [
            {
                input: "anagram nagaram",
                output: "true",
            },
            {
                input: "rat car",
                output: "false",
            },
        ],
        testCases: [
            {
                id: 1,
                arguments: "anagram nagaram",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 2,
                arguments: "rat car",
                expectedOutput: "false",
                isHidden: false,
            },
            {
                id: 3,
                arguments: "a a",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 4,
                arguments: "ab ba",
                expectedOutput: "true",
                isHidden: false,
            },
            {
                id: 5,
                arguments: "aacc ccac",
                expectedOutput: "false",
                isHidden: false,
            },
            {
                id: 6,
                arguments: "cinema iceman",
                expectedOutput: "true",
                isHidden: true,
                isLocked: true,
            },
            {
                id: 7,
                arguments: "aabb abab",
                expectedOutput: "true",
                isHidden: true,
                isLocked: true,
            },
        ],
        starterCode: {
            71: `import sys
  
  def is_anagram(s, t):
      # Write your code here
      pass
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      args = sys.argv[1].split()
      s = args[0]
      t = args[1]
      result = is_anagram(s, t)
      print(str(result).lower())
  else:
      print("No arguments provided.")
  `,
            63: `function isAnagram(s, t) {
      // Write your code here
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const [s, t] = args[0].split(' ');
      const result = isAnagram(s, t);
      console.log(result.toString());
  } else {
      console.log("No arguments provided.");
  }
  `,
            54: `#include <iostream>
  #include <string>
  #include <unordered_map>
  #include <sstream>
  
  using namespace std;
  
  bool isAnagram(string s, string t) {
      // Write your code here
      return false;
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          string arg = argv[1];
          stringstream ss(arg);
          string s, t;
          ss >> s >> t;
          
          bool result = isAnagram(s, t);
          cout << (result ? "true" : "false") << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }
  `,
        },
        tags: ["hash-table", "string", "sorting"],
    },
]
