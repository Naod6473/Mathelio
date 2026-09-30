"""Generate original, quiet synthesized motifs; no third-party audio samples."""
from pathlib import Path
import math, wave, struct
ROOT=Path(__file__).resolve().parents[1]/'assets'/'audio'
RATE=22050
def write(folder,name,notes,beat=.36,tail=.3):
    size=int((len(notes)*beat+tail)*RATE)
    samples=[0.0]*size
    for i,n in enumerate(notes):
        if n is None: continue
        freq=440*2**((n-69)/12)
        duration=beat*.85+tail
        for j in range(min(int(duration*RATE),size-int(i*beat*RATE))):
            t=j/RATE
            env=min(1,t/.015)*math.exp(-t*6)*min(1,(duration-t)/.04)
            samples[int(i*beat*RATE)+j]+=.23*env*(math.sin(2*math.pi*freq*t)+.15*math.sin(4*math.pi*freq*t))
    dest=ROOT/folder/name;dest.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(dest),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x))*32767)) for x in samples))
write('music','launch.wav',[60,64,67,None,72,67,64,None,62,65,69,None,67,64,60,None]*3,.5)
write('music','background-01.wav',[60,None,67,64,None,69,67,None,65,None,64,62,None,64,60,None]*4,.55)
write('music','background-02.wav',[57,60,None,64,67,None,64,None,62,65,None,69,67,None,60,None]*4,.6)
write('sfx','click-01.wav',[79],.035,.035)
write('sfx','success-01.wav',[72,76,79],.11,.18)
write('sfx','error-01.wav',[64,62],.15,.18)
write('sfx','badge-01.wav',[60,64,67,72,76],.14,.3)
write('sfx','finish-01.wav',[60,64,67,72,None,76,72],.18,.3)
