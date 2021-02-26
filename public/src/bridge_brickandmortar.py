import numpy as np
import networkx as nx
import json
from tqdm import tqdm
import matplotlib.pyplot as plt
import matplotlib.animation as animation

wall=1
exp=-1
vis=1
uexp=0
n=0
s=1
e=2
w=3


#input: enter the json file path.
#output: a numpy array of grid
def npgrid(filepath):
    with open(filepath, 'r') as j:
        grid=json.load(j)
    npmap=np.zeros((grid['dimensions'][0]['rows'],grid['dimensions'][0]['columns']))
    for cell in grid['map']:
        if cell['isWall']=='true':
            npmap[cell['x'],cell['y']]=1
        else:
            continue
    return npmap

#input: numpy array of grid
#output: a graph object that is used to decide whether to mark a cell as visited or explored
def makegraph(array):
    l,b=array.shape
    smallg = nx.Graph()
    for i in range(l*b):
        smallg.add_node(i)
    for i in range(l*b):
        x=int(i/l)
        y=i%b
        if array[x,y]!=1 and x-1>0 and array[x-1,y]!=1:
            smallg.add_edge(x*l+y,(x-1)*l+y)
        if array[x,y]!=1 and x+1<l and array[x+1,y]!=1:
            smallg.add_edge(x*l+y,(x+1)*l+y)
        if array[x,y]!=1 and y-1>0 and array[x,y-1]!=1:
            smallg.add_edge(x*l+y,x*l+y-1)
        if array[x,y]!=1 and y+1<b and array[x,y+1]!=1:
            smallg.add_edge(x*l+y,x*l+y+1)
    return smallg
#nx.draw(G)

#returns whether we can mark cell as explored or not
#input : grid's numpy matrix marked as 1 or 0 and x and y coordinate of the cell for to be marked
#output : True if cell can be marked as visited False otherwise
def graphextractor(grid,graph,x,y):
    (l,b)=grid.shape
    cellid=x*l+y
    bridges=list(nx.bridges(graph))
    visit=True
    count=0
    for bridge in bridges:
        if cellid in bridge and graph.degree(cellid)!=1:
            visit=False
            break
    return visit


#Computes visit permission on smaller version of graph with function graphextractor
def visitpermission(grid,graph,x,y):
    smallgraph=makegraph(grid[x-3:x+4,y-3:y+4])
    return graphextractor(grid[x-3:x+4,y-3:y+4],smallgraph,3,3)
    
#counts the number of explored cells around a cell
#input : Grid in form of a numpy matrix and x and y coordinates of a cell
#output : returns the count
def availablemoves(grid,x,y):
    c=0
    (l,b)=grid.shape
    if x>0 and y>0 and x<l-1 and y<b-1:
        c=int(grid[x-1,y]!=1)+int(grid[x+1,y]!=1)+int(grid[x,y-1]!=1)+int(grid[x,y+1]!=1)
    elif x==0 and y>0 and y<b-1:
        c=int(grid[x+1,y]!=1)+int(grid[x,y-1]!=1)+int(grid[x,y+1]!=1)
    elif y==0 and x>0 and x<l-1:
        c=int(grid[x-1,y]!=1)+int(grid[x+1,y]!=1)+int(grid[x,y+1]!=1)
    elif y==b-1 and x>0 and x<l-1:
        c=int(grid[x-1,y]!=1)+int(grid[x+1,y]!=1)+int(grid[x,y-1]!=1)
    elif x==l-1 and y>0 and y<b-1:
        c=int(grid[x-1,y]!=1)+int(grid[x,y-1]!=1)+int(grid[x,y+1]!=1)
    elif x==0 and y==0:
        c=int(grid[x+1,y]!=1)+int(grid[x,y+1]!=1)
    elif x==0 and y==b-1:
        c=int(grid[x+1,y]!=1)+int(grid[x,y-1]!=1)
    elif x==l-1 and y==0:
        c=int(grid[x-1,y]!=1)+int(grid[x,y+1]!=1)
    else:
        c=int(grid[x-1,y]!=1)+int(grid[x,y-1]!=1)  
    return c
    
        
#counts the number of explored cells around a cell
#input : Grid in form of a numpy matrix and x and y coordinates of a cell
#output : returns the count
def counter(grid,x,y):
    c=0
    (l,b)=grid.shape
    if x>0 and y>0 and x<l-1 and y<b-1:
        c=int(grid[x-1,y]!=0)+int(grid[x+1,y]!=0)+int(grid[x,y-1]!=0)+int(grid[x,y+1]!=0)
    elif x==0 and y>0 and y<b-1:
        c=int(grid[x+1,y]!=0)+int(grid[x,y-1]!=0)+int(grid[x,y+1]!=0)
    elif y==0 and x>0 and x<l-1:
        c=int(grid[x-1,y]!=0)+int(grid[x+1,y]!=0)+int(grid[x,y+1]!=0)
    elif y==b-1 and x>0 and x<l-1:
        c=int(grid[x-1,y]!=0)+int(grid[x+1,y]!=0)+int(grid[x,y-1]!=0)
    elif x==l-1 and y>0 and y<b-1:
        c=int(grid[x-1,y]!=0)+int(grid[x,y-1]!=0)+int(grid[x,y+1]!=0)
    elif x==0 and y==0:
        c=int(grid[x+1,y]!=0)+int(grid[x,y+1]!=0)
    elif x==0 and y==b-1:
        c=int(grid[x+1,y]!=0)+int(grid[x,y-1]!=0)
    elif x==l-1 and y==0:
        c=int(grid[x-1,y]!=0)+int(grid[x,y+1]!=0)
    else:
        c=int(grid[x-1,y]!=0)+int(grid[x,y-1]!=0)  
    return c
    
        
#returns the direction in which agent should move
#input: numpy array of grid, x and y coordinates, number of adjacent points for north, south, east and west 
#output: Direction to move in
def direction(north,south,east,west):
    pref=[]
    dc=[north,south,east,west]
    for i in range(4):
        m=np.argmax(dc)
        dc[m]=-3
        pref.append(m)
    return pref

decisionarray=[]

#input: x and y coordinates of agent. And a bollean whether agent is stuck in loop or not.
#output: next x and y cordinates for the robot to move
def move(grid,graph,x,y,moves,stuck):
    global decisionarray
    (l,b)=grid.shape
    north,south,east,west=-2,-2,-2,-2
    if not stuck:
        mark=visitpermission(grid,graph,x,y)
    else:
        #mark=visitpermission(grid,graph,x,y)
        mark=graphextractor(grid,graph,x,y)
    decisionarray.append([mark,x,y])
    if mark:
        grid[x,y]=vis
        graph.remove_node(x*l+y)
    else:
        grid[x,y]=exp
    if x>0 and grid[x-1,y]!=wall:
        north=counter(grid,x-1,y)
    if y>0 and grid[x,y-1]!=wall:
        east=counter(grid,x,y-1)
    if x<l-1 and grid[x+1,y]!=wall:
        south=counter(grid,x+1,y)
    if y<b-1 and grid[x,y+1]!=wall:
        west=counter(grid,x,y+1)
    am=availablemoves(grid,x,y)
    dcs=direction(north,south,east,west)
    oldx=x
    oldy=y
    if am==0:
        return -1,-1
    elif am==1:
        dc=dcs[0]
        if dc==n:
            x=x-1
        elif dc==s:
            x=x+1
        elif dc==e:
            y=y-1
        elif dc==w:
            y=y+1
        else:
            print('exception')
            pass    
    else:
        for dc in dcs:
            if dc==n and x-1!=moves[-2][0]:
                x=x-1
                break
            elif dc==s and x+1!=moves[-2][0]:
                x=x+1
                break
            elif dc==e and y-1!=moves[-2][1]:
                y=y-1
                break
            elif dc==w and y+1!=moves[-2][1]:
                y=y+1
                break
            else:
                continue
    moves.append([x,y])
    #print('coordinates: '+str(oldx)+','+str(oldy)+' move: '+str(dc)+' marked: '+str(mark))
    return x,y

grid=npgrid('data14.json')
plt.imshow(grid)
l,b=grid.shape
G = nx.Graph()
for i in tqdm(range(l*b)):
    G.add_node(i)
for i in tqdm(range(l*b)):
    x=int(i/l)
    y=i%b
    if grid[x,y]!=1 and x-1>0 and grid[x-1,y]!=1:
        G.add_edge(x*l+y,(x-1)*l+y)
    if grid[x,y]!=1 and x+1<l and grid[x+1,y]!=1:
        G.add_edge(x*l+y,(x+1)*l+y)
    if grid[x,y]!=1 and y-1>0 and grid[x,y-1]!=1:
        G.add_edge(x*l+y,x*l+y-1)
    if grid[x,y]!=1 and y+1<b and grid[x,y+1]!=1:
        G.add_edge(x*l+y,x*l+y+1)
#nx.draw(G)

for i in tqdm(range(l*b)):
    if G.degree(i)==0:
        G.remove_node(i)

def totuple(a):
    try:
        return tuple(totuple(i) for i in a)
    except TypeError:
        return a

x,y=400,300
moves=[[x,y],[x,y]]
snapshots=[]
loc=[]
leng=0
count=0
while grid[x,y]!=wall:
    graphlength=len(G)
    if graphlength==leng:
        count+=1
    else:
        count=0
    if len(moves)%500==0:
        print(graphlength,end=' ')
    if len(moves)%110==0:
        snapshots.append(tuple(totuple(i) for i in grid))
    if count>2000:
        stuck=True
    else:
        stuck=False
    leng=graphlength    
    x,y=move(grid,G,x,y,moves,stuck)

plt.rcParams['animation.ffmpeg_path']='/Users/alokmalik/opt/anaconda3/envs/arlstrong/bin/ffmpeg'

print('Length of snapshots: ',len(snapshots))
fps = 30
nSeconds = 5

fig = plt.figure( figsize=(8,8) )

a = snapshots[1000]
im = plt.imshow(a, interpolation='none', aspect='auto', vmin=0, vmax=1)
def animate_func(i):
    if i % fps == 0:
        print( '.', end ='' )

    im.set_array(snapshots[i])
    return [im]

anim = animation.FuncAnimation(
                               fig, 
                               animate_func, 
                               frames = len(snapshots),
                               interval = 1000 / fps, # in ms
                               blit=True)

anim.save('data14.mp4', fps=fps)

print('Done!')