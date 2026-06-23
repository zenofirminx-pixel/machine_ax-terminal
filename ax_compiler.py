import struct
import sys
import re

SIGNATURE = b"AX3D"
VERSION = 4

# Instructions AX v4/v1
CREATE_OBJECT = 0x01
POSITION = 0x02
ROTATION = 0x03
SCALE = 0x04
COLOR = 0x05
MOVE = 0x06 # Stick manette
DESTROY = 0x07
IF_BUTTON = 0x08
MODEL = 0x09
TEXTURE = 0x0A
ANIMATION = 0x0B
CAMERA_FOLLOW = 0x0C
MOVE_AI = 0x0D # NOUVEAU : Intelligence artificielle autonome
END_INIT = 0xFF

OBJECTS = {
    "cube": 1, "character": 2, "enemy": 3, "vehicle": 4,
    "planet": 5, "light": 6, "camera": 7, "monster": 3, "gateway": 5
}
COLORS = { "red": 1, "blue": 2, "green": 3, "white": 4, "black": 5 }
BUTTONS = { "buttona": 0, "a": 0, "buttonb": 1, "b": 1, "buttonx": 2, "x": 2, "buttony": 3, "y": 3 }

class AXCompiler:
    def __init__(self):
        self.bytecode = bytearray()
        self.objects = {"camera": 7}
        self.next_id = 0

    def validate_structure(self, source):
        lines = [l.strip() for l in source.splitlines() if l.strip()]
        has_game_title = any(line.lower().startswith('game "') for line in lines)
        has_objects = any(line.lower().startswith('object ') for line in lines)
        has_update = any('update {' in line for line in lines)

        if not (has_game_title and has_objects and has_update):
            print("❌ ERREUR DE VALIDATION : Votre format des jeux est pas compatible")
            return False
        return True

    def compile(self, source):
        if not self.validate_structure(source):
            return None

        lines = source.splitlines()
        in_update_block = False
        init_lines = []
        update_lines = []

        for line in lines:
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("#"):
                continue
            if "update {" in line:
                in_update_block = True
                continue
            if in_update_block and line == "}":
                in_update_block = False
                continue

            if in_update_block:
                update_lines.append(line)
            else:
                init_lines.append(line)

        for line in init_lines:
            self.compile_instruction(line)

        self.bytecode.append(END_INIT)

        for line in update_lines:
            self.compile_instruction(line)

        return self.bytecode

    def compile_instruction(self, line):
        if line.lower().startswith("game "):
            return

        if line.startswith("object "):
            parts = line.split()
            if len(parts) >= 3:
                name = parts[1]
                obj_type = parts[2]
                obj_id = self.next_id
                self.objects[name] = obj_id
                self.next_id += 1
                self.bytecode.extend([CREATE_OBJECT, obj_id, OBJECTS.get(obj_type.lower(), 1)])

        elif ".position" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                vals = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                if len(vals) >= 3:
                    x, y, z = map(float, vals[:3])
                    self.bytecode.append(POSITION)
                    self.bytecode.append(self.objects[name])
                    self.bytecode.extend(struct.pack("<fff", x, y, z))

        elif ".rotation" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                vals = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                if len(vals) >= 3:
                    x, y, z = map(float, vals[:3])
                    self.bytecode.append(ROTATION)
                    self.bytecode.append(self.objects[name])
                    self.bytecode.extend(struct.pack("<fff", x, y, z))

        elif ".scale" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                vals = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                if len(vals) >= 3:
                    x, y, z = map(float, vals[:3])
                    self.bytecode.append(SCALE)
                    self.bytecode.append(self.objects[name])
                    self.bytecode.extend(struct.pack("<fff", x, y, z))

        # GESTION DES COULEURS RGB 0-255
        elif ".color" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                vals = re.findall(r"\d+", line)
                if len(vals) >= 3:
                    r, g, b = map(int, vals[:3])
                    # Clamp 0-255
                    r = max(0, min(255, r))
                    g = max(0, min(255, g))
                    b = max(0, min(255, b))
                    self.bytecode.extend([COLOR, self.objects[name], r, g, b])

        elif ".model" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                path = line.split('"')[1]
                data = path.encode('utf-8')
                self.bytecode.extend([MODEL, self.objects[name], len(data)])
                self.bytecode.extend(data)

        elif ".texture" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                path = line.split('"')[1]
                data = path.encode('utf-8')
                self.bytecode.extend([TEXTURE, self.objects[name], len(data)])
                self.bytecode.extend(data)

        elif "camera.follow" in line:
            target = line.split("(")[1].split(")")[0].strip()
            if target in self.objects:
                self.bytecode.extend([CAMERA_FOLLOW, self.objects[target]])

        # GESTION DES DEUX TYPES DE MOVE ICI
        elif ".move" in line:
            name = line.split(".")[0].strip()
            if name in self.objects:
                # On regarde ce qu'il y a entre parenthèses : move(ai) ou move(stick)
                param_match = re.search(r"\.move\((.*?)\)", line)
                param = param_match.group(1).strip().lower() if param_match else "stick"

                if param == "ai":
                    self.bytecode.extend([MOVE_AI, self.objects[name]]) # Opcode 0x0D pour l'IA
                else:
                    self.bytecode.extend([MOVE, self.objects[name]]) # Opcode 0x06 pour le Joueur

        elif line.startswith("if"):
            btn_match = re.search(r"if\s*\((.*?)\)", line)
            if btn_match:
                btn_name = btn_match.group(1).strip().lower()
                btn_id = BUTTONS.get(btn_name, 0)

                sub_instruction = line.split("{")[1].split("}")[0].strip()

                sub_compiler = AXCompiler()
                sub_compiler.objects = self.objects
                sub_bytes = sub_compiler.compile_sub_only(sub_instruction)

                self.bytecode.extend([IF_BUTTON, btn_id])
                self.bytecode.extend(struct.pack("<h", len(sub_bytes)))
                self.bytecode.extend(sub_bytes)

    def compile_sub_only(self, line):
        self.compile_instruction(line)
        return self.bytecode

def build(filename):
    with open(filename, "r", encoding="utf-8") as f:
        source = f.read()

    compiler = AXCompiler()
    code = compiler.compile(source)

    if code is None:
        print("⛔ BUILD ANNULÉ : Le fichier source ne respecte pas les spécifications AX3D.")
        sys.exit(1)

    output = filename.replace(".axs", ".ax")
    with open(output, "wb") as f:
        f.write(SIGNATURE)
        f.write(struct.pack("<I", VERSION))
        f.write(struct.pack("<I", len(code)))
        f.write(struct.pack("<I", 0))
        f.write(code)

    print(f"⚡ AX BUILD SUCCESS -> {output} ({len(code)} bytes)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ax_compiler.py game.axs")
    else:
        build(sys.argv[1])