---

layout: single
title: Developing Service Agent using Python Decorators 
subtitle: Managing preprocess and meta-information of function and class using decorators
categories: Development 
tags: Python Service Testbed
header:
  image: /assets/images/PythonDecorator/adam-jaime-iciBcD8NOeA-unsplash.jpg
  caption: "[Photo by Adam Jaime on Unsplash](https://unsplash.com/photos/iciBcD8NOeA)" 

---

When I participated in different IoT testbed development project, using Java annotations were very impressive. Within appropriate annotations, information of the service agents were automatically registered to the server, and also UI was generated to let the people use.

So, I want to use such functionalities in our lab's IoT testbed development, for managing meta-information of agents. And since our project use Python, now I'm trying to use decorator.

For now, I used descorators for (1) applying pre-processing and post-processing to the functions and (2) writing meta-information of functions and classes, as followings.

## Function pre-processing and post-processing by using decorators

This is the common form of decorator. When you want to do some pre-processing or post-processing to multiple functions, you can use decorator to decorate the functions.

Basic usage is like below. Decorator receives function as an argument and return a new function that wraps the given function. Then Python interpreter overrides function body with the function that decorator returns, when it defines the function.

```python
def decorator(f):
	def processing(*args, **kwargs):
		print("pre_processing")
		result = f(*args, **kwargs)
		print("post_processing")
		return result
	return processing

@decorator
def function_to_decorate():
	print("function")

>>> function_to_decorate()
>>> "pre_processing"
>>> "function"
>>> "post_processing"
```

### Maintain docstring

Using decorator purely, function's docstrings will be erased. You can fix this by using `wraps` decorator.

```python
from functools import wraps

def decorator(f):
	@wraps(f)
	def processing(*args, **kwargs):
		pre_processing()
		result = f(*args, **kwargs)
		post_processing()
		return result
	return processing

@decorator
def function_to_decorate():
	""" function docstring """
	something()

>>> print(function_to_decorate.__doc__)
>>> """ function docstring """
```

### Class's method decoration

For our IoT testbed, we define agents as classes and the functionalities provided by agents are defined as methods. So decorators needed to decorator methods that has the `self` argument, and decorators can deal with certain arguments.

```python
def decorator(f):
	def processing(self, *args, **kwargs):
		pre_processing()
		result = f(self, *args, **kwargs)
		post_processing()
		return result
	return processing

class Agent:
	@decorator
	def method_to_decorate(self):
		something()
```

### Example: authentication_required

For example, `authentication_required`, `authorization_required` decorators were developed for our testbed. As its names indicates, those decorators perform authentication or authorization and returns exception if it fails.

```python
def authentication_required(f):
	def check_authentication(self, *args, **kwargs):
		result = authentication()
		if result == 'success':
			return f(self, *args, **kwargs)
		else:
			raise AuthenticationException
	return check_authentication
```

### Decorator with input

Moreover, decorators may receive input argument and process according to the inputs. For this, definition of decorator becomes one step deeper.

```python
def decorator(arguments):
	def wrapper(f):
		def processing(*args, **kwargs):
			pre_processing(arguments)
			result = f(*args, **kwargs)
			post_processing(arguments)
			return result
		return processing
	return wrapper
```

### Pass variable from decorator to function

Decorators can pass variable to function after do some pre-process. There are two ways for this: (1) overriding function's argument or (2) add value to `kwargs`.

```python
def decorator(f):
	def processing(*args, **kwargs):
		return f(value, *args, **kwargs)
	return processing

@decorator
def function_to_decorate(value):  # override the argument
	print(value)
```

```python
def decorator(f):
	def processing(*args, **kwargs):
		kwargs["key"] = value
		return f(*args, **kwargs)
	return processing

@decorator
def function_to_decorate(*args, **kwargs):
	print(kwargs["key"])
```

### Example: resource_required

In out testbed, we developed a decorator `resource_required`. It receives description of required resource for the agent. Then it discovers and binds it and pass the information for controlling the resource, to the function. After using the resource, decorator can unbind/release the resource automatically.

```python
def resource_required(resource_description):
	def wrapper(f):
		def processing(self, *args, **kwargs):
			resource, success = bind_resource(resource_description)
			
			if success:
				result = f(self, resource, *args, **kwargs)
				unbind_resource(resource)
			else:
				raise ResourceBindFailedException

class Agent:
	@resource_required(url='localhost:8001')
	def action(self, resource=None):
		resource.utilize()
```

Decorators can be defined in a form of class, but skip that since we haven't used it for this testbed development.

---

## Meta-information decorator for functions and classes

It was great to do pre-processing and post-processing using decorators, I also wanted to add meta-information to functions and classes automatically. After some searching, I succeed it with decorators.

In this case, decorator should work at definition phase, and not execution phase, so grammar becomes a little bit different. Decorator returns function itself instead of 'a new wrapper function that execute original function and returns the result'.

```python
def meta_info_decorator(name, description):
	def decorator(f):
		f.meta_info = {
			"name": name,
			"description": description
		}
		return f
	return decorator

@meta_info_decorator(
    name="function", 
    description="example description"
)
def function():
	pass

>>> print(function.meta_info)
>>> {'name': 'function', 'description': 'example description'}
```

### Class decoration

Furthermore, not only functions but also classes can be decorated. Grammar is same as functions.

```python
def class_decorator(name, description):
	def decorator(cls):
		cls.meta_info = {
			"name": name,
			"description": description
		}
		return cls
	return decorator

@class_decorator(
    name="class", 
    description="example description"
)
class Agent:
	pass

>>> print(Agent.meta_info)
>>> {'name': 'class', 'description': 'example description'}
```

### Example: Service Agent

Finally, the example of our service agent becomes like below, as a summary of above usages.

```python
@meta_info(
	name="LightingServiceAgent",
	description="Service agent for lighting of the testbed",
	url="localhost:8000"
)
class LightingServiceAgent(Agent):
	@authorization_required
	@resource_required(
		type="LightingDevice"
	)
	def turnon(self, resource):
		resource.turnon()
```

---

It was great to automate many functionalities clearly.