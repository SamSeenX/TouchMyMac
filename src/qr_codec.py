"""qr_codec.py - Minimal QR Code encoder (Version 4, Low EC, Byte Mode)."""

from src.qr_math import rs_encode

SIZE = 33  # Version 4 is 33x33
TOTAL_BYTES = 100
DATA_BYTES = 80
EC_BYTES = 20

def _create_empty_grid():
    matrix = [[None for _ in range(SIZE)] for _ in range(SIZE)]
    is_function = [[False for _ in range(SIZE)] for _ in range(SIZE)]
    return matrix, is_function

def _place_finder(matrix, is_func, top, left):
    for r in range(-1, 8):
        for c in range(-1, 8):
            row, col = top + r, left + c
            if 0 <= row < SIZE and 0 <= col < SIZE:
                is_func[row][col] = True
                if 0 <= r <= 6 and 0 <= c <= 6:
                    matrix[row][col] = (r in (0, 6) or c in (0, 6) or (2 <= r <= 4 and 2 <= c <= 4))
                else:
                    matrix[row][col] = False

def _place_alignment(matrix, is_func, cr, cc):
    for r in range(-2, 3):
        for c in range(-2, 3):
            row, col = cr + r, cc + c
            if not is_func[row][col]:
                is_func[row][col] = True
                matrix[row][col] = (abs(r) == 2 or abs(c) == 2 or (r == 0 and c == 0))

def _add_function_patterns(matrix, is_func):
    _place_finder(matrix, is_func, 0, 0)
    _place_finder(matrix, is_func, 0, SIZE - 7)
    _place_finder(matrix, is_func, SIZE - 7, 0)
    _place_alignment(matrix, is_func, 26, 26)

    # Timing patterns
    for i in range(SIZE):
        if not is_func[6][i]:
            matrix[6][i] = (i % 2 == 0)
            is_func[6][i] = True
        if not is_func[i][6]:
            matrix[i][6] = (i % 2 == 0)
            is_func[i][6] = True

    # Dark module
    matrix[SIZE - 8][8] = True
    is_func[SIZE - 8][8] = True

    # Reserve format info areas
    for i in range(9):
        if not is_func[8][i]: is_func[8][i] = True
        if not is_func[i][8]: is_func[i][8] = True
    for i in range(SIZE - 8, SIZE):
        if not is_func[8][i]: is_func[8][i] = True
        if not is_func[i][8]: is_func[i][8] = True

def _build_data_stream(text):
    raw = text.encode("utf-8")
    bits = [0, 1, 0, 0]  # Byte mode indicator
    for i in range(7, -1, -1):
        bits.append((len(raw) >> i) & 1)
    for byte in raw:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)
    # Terminator
    bits.extend([0] * min(4, DATA_BYTES * 8 - len(bits)))
    while len(bits) % 8 != 0:
        bits.append(0)
    pad = [0xEC, 0x11]
    p_idx = 0
    data = bytearray()
    for i in range(0, len(bits), 8):
        b = 0
        for j in range(8):
            b = (b << 1) | bits[i + j]
        data.append(b)
    while len(data) < DATA_BYTES:
        data.append(pad[p_idx % 2])
        p_idx += 1
    ec = rs_encode(data, EC_BYTES)
    all_bytes = data + bytearray(ec)
    final_bits = []
    for b in all_bytes:
        for i in range(7, -1, -1):
            final_bits.append((b >> i) & 1)
    final_bits.extend([0] * 7)  # 7 remainder bits for V4
    return final_bits

def _place_bits_and_mask(matrix, is_func, bits):
    b_idx = 0
    right = SIZE - 1
    while right > 0:
        if right == 6:
            right -= 1
        for vert in range(SIZE):
            for j in range(2):
                col = right - j
                row = SIZE - 1 - vert if ((right + 1) // 2) % 2 == 1 else vert
                if not is_func[row][col]:
                    bit = bits[b_idx] if b_idx < len(bits) else 0
                    b_idx += 1
                    # Mask pattern 0: (row + col) % 2 == 0
                    matrix[row][col] = bool(bit ^ (((row + col) % 2) == 0))
        right -= 2

def _apply_format_bits(matrix):
    # Mask 0, Low Error Correction format sequence (pre-computed BCH): 111011111000100
    format_bits = 0b111011111000100
    for i in range(15):
        bit = bool((format_bits >> (14 - i)) & 1)
        # Top-left format line
        if i <= 5: r, c = 8, i
        elif i == 6: r, c = 8, 7
        elif i <= 8: r, c = 8, i
        elif i <= 14: r, c = 14 - i, 8
        matrix[r][c] = bit
        # Bottom-left and top-right format lines
        if i < 7:
            matrix[SIZE - 1 - i][8] = bit
        else:
            matrix[8][SIZE - 15 + i] = bit

def generate_qr_matrix(text):
    matrix, is_func = _create_empty_grid()
    _add_function_patterns(matrix, is_func)
    bits = _build_data_stream(text)
    _place_bits_and_mask(matrix, is_func, bits)
    _apply_format_bits(matrix)
    return matrix
