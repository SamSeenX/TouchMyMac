"""qr_math.py - Galois Field GF(256) and Reed-Solomon polynomial math."""

EXP = [0] * 512
LOG = [0] * 256

def _init_tables():
    x = 1
    for i in range(255):
        EXP[i] = x
        EXP[i + 255] = x
        LOG[x] = i
        x <<= 1
        if x >= 256:
            x ^= 0x11D

_init_tables()

def gf_mul(x, y):
    if x == 0 or y == 0:
        return 0
    return EXP[LOG[x] + LOG[y]]

def rs_generator_poly(nsym):
    g = [1]
    for i in range(nsym):
        # Multiply g by (x - 2^i)
        root = EXP[i]
        new_g = [0] * (len(g) + 1)
        for j, coef in enumerate(g):
            new_g[j] ^= coef
            new_g[j + 1] ^= gf_mul(coef, root)
        g = new_g
    return g

def rs_encode(data, nsym):
    gen = rs_generator_poly(nsym)
    msg_out = list(data) + [0] * nsym
    for i in range(len(data)):
        coef = msg_out[i]
        if coef != 0:
            for j in range(len(gen)):
                msg_out[i + j] ^= gf_mul(gen[j], coef)
    return msg_out[len(data):]
