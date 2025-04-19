// String Reverse Solution
export const stringReverseSolution = {
    python: `import sys
  
  def reverse_string(s):
      return s[::-1]
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      input_string = sys.argv[1]
      result = reverse_string(input_string)
      print(result)
  else:
      print("No arguments provided.")
  `,
    javascript: `function reverseString(s) {
      return s.split('').reverse().join('');
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const inputString = args[0];
      const result = reverseString(inputString);
      console.log(result);
  } else {
      console.log("No arguments provided.");
  }`,
    cpp: `#include <iostream>
  #include <string>
  #include <algorithm>
  
  using namespace std;
  
  string reverseString(string s) {
      reverse(s.begin(), s.end());
      return s;
  }
  
  int main(int argc, char* argv[]) {
      if (argc > 1) {
          string input = argv[1];
          cout << reverseString(input) << endl;
      } else {
          cout << "No arguments provided." << endl;
      }
      return 0;
  }`,
}

// Palindrome Check Solution
export const palindromeCheckSolution = {
    python: `import sys
  import re
  
  def is_palindrome(s):
      # Remove non-alphanumeric characters and convert to lowercase
      s = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
      return s == s[::-1]
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      input_string = sys.argv[1]
      result = is_palindrome(input_string)
      print(str(result).lower())
  else:
      print("No arguments provided.")
  `,
    javascript: `function isPalindrome(s) {
      // Remove non-alphanumeric characters and convert to lowercase
      s = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return s === s.split('').reverse().join('');
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const inputString = args[0];
      const result = isPalindrome(inputString);
      console.log(result.toString());
  } else {
      console.log("No arguments provided.");
  }`,
}

// FizzBuzz Solution
export const fizzBuzzSolution = {
    python: `import sys
  
  def fizz_buzz(n):
      result = []
      for i in range(1, n + 1):
          if i % 3 == 0 and i % 5 == 0:
              result.append("FizzBuzz")
          elif i % 3 == 0:
              result.append("Fizz")
          elif i % 5 == 0:
              result.append("Buzz")
          else:
              result.append(str(i))
      return ", ".join(result)
  
  # Parse command line arguments
  if len(sys.argv) > 1:
      n = int(sys.argv[1])
      result = fizz_buzz(n)
      print(result)
  else:
      print("No arguments provided.")
  `,
    javascript: `function fizzBuzz(n) {
      const result = [];
      for (let i = 1; i <= n; i++) {
          if (i % 3 === 0 && i % 5 === 0) {
              result.push("FizzBuzz");
          } else if (i % 3 === 0) {
              result.push("Fizz");
          } else if (i % 5 === 0) {
              result.push("Buzz");
          } else {
              result.push(i.toString());
          }
      }
      return result.join(", ");
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const n = parseInt(args[0]);
      const result = fizzBuzz(n);
      console.log(result);
  } else {
      console.log("No arguments provided.");
  }`,
}

// Two Sum Solution
export const twoSumSolution = {
    python: `import sys
  
  def two_sum(nums, target):
      num_map = {}
      for i, num in enumerate(nums):
          complement = target - num
          if complement in num_map:
              return [num_map[complement], i]
          num_map[num] = i
      return [-1, -1]  # No solution found
  
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
    javascript: `function twoSum(nums, target) {
      const numMap = new Map();
      for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (numMap.has(complement)) {
              return [numMap.get(complement), i];
          }
          numMap.set(nums[i], i);
      }
      return [-1, -1]; // No solution found
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
  }`,
}

// Valid Anagram Solution
export const validAnagramSolution = {
    python: `import sys
  from collections import Counter
  
  def is_anagram(s, t):
      return Counter(s) == Counter(t)
  
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
    javascript: `function isAnagram(s, t) {
      if (s.length !== t.length) return false;
      
      const charCount = {};
      
      // Count characters in s
      for (let char of s) {
          charCount[char] = (charCount[char] || 0) + 1;
      }
      
      // Decrement counts for characters in t
      for (let char of t) {
          if (!charCount[char]) return false;
          charCount[char]--;
      }
      
      // Check if all counts are zero
      return Object.values(charCount).every(count => count === 0);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
      const [s, t] = args[0].split(' ');
      const result = isAnagram(s, t);
      console.log(result.toString());
  } else {
      console.log("No arguments provided.");
  }`,
}
