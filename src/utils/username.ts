// Username validation and normalization utilities

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  normalized: string;
}

/**
 * Validates a candidate username according to fintech platform standards:
 * - 3 to 20 characters in length
 * - Allowed characters: letters (a-z, A-Z), numbers (0-9), underscores (_), and periods (.)
 * - Cannot start or end with a period or underscore
 * - Cannot contain consecutive periods or underscores (e.g., '..', '__')
 * - Cannot be empty or purely whitespace
 */
export function validateUsername(rawInput: string): UsernameValidationResult {
  const trimmed = (rawInput || '').trim();
  const normalized = trimmed.toLowerCase();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Username cannot be empty.',
      normalized: '',
    };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters long.',
      normalized,
    };
  }

  if (trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Username cannot exceed 20 characters.',
      normalized,
    };
  }

  // Allowed character rule: letters, numbers, underscore, period
  const allowedPattern = /^[a-zA-Z0-9._]+$/;
  if (!allowedPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores (_), and periods (.).',
      normalized,
    };
  }

  // Cannot start or end with period or underscore
  if (/^[._]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username cannot start with a period or underscore.',
      normalized,
    };
  }

  if (/[._]$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username cannot end with a period or underscore.',
      normalized,
    };
  }

  // Disallow consecutive dots or underscores like ".." or "__"
  if (/\.\.|\_\_|\.\_|\_\./.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username cannot contain consecutive special characters.',
      normalized,
    };
  }

  return {
    isValid: true,
    normalized,
  };
}
