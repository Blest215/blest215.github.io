---

layout: single
title: 파이썬 decorator를 사용한 서비스 에이전트 개발
subtitle: Decorator를 사용한 전처리 및 메타 정보 관리
categories: Development 
tags: Python Service Testbed
header:
  image: /assets/images/PythonDecorator/adam-jaime-iciBcD8NOeA-unsplash.jpg
  caption: "[Photo by Adam Jaime on Unsplash](https://unsplash.com/photos/iciBcD8NOeA)"

---

예전에 다른 IoT 테스트베드 개발 프로젝트에 참여했을 때, Java의 annotation을 잘 활용해서 서비스 에이전트에 적절한 annotation을 달면 자동으로 에이전트의 정보가 서버에 등록되어 사람들이 활용할 수 있는 UI까지 자동으로 생성해주는 기능이 인상적이었다.

그래서 우리 연구실의 테스트베드 개발에도 이처럼 에이전트의 메타 정보를 편하게 관리할 수 있도록 하고 싶었고, Python에서 지원하는 decorator를 적극적으로 활용하려고 하는 중이다.

현재는 (1) 함수를 실행할 때 앞뒤로 실행되어야 하는 기능을 일괄적으로 적용하는 것과 (2) 함수와 클래스의 메타 정보를 작성하는 것에 decorator를 사용하고 있고, 아래에서 설명해보도록 하겠다.

## 함수 전처리 및 후처리 decoration

일반적으로 활용되는 decorator의 형태이다. 여러 함수의 앞이나 뒤에 공통된 처리를 해주고 싶을 때 사용한다. 

기본적인 문법은 다음과 같다. 함수를 인자로 받아 이를 감싸는 함수를 다시 반환하는 식이다. 그러면 Python 인터프리터는 decorator의 대상 함수를 정의할 때, 함수의 내용을 decorator에서 반환하는 내용으로 바꾼다.

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

### Docstring 유지하기

Decorator를 사용하면 함수의 docstring이 사라진다는 문제가 있는데, `wraps` 데코레이터를 사용해서 해결할 수 있다.

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

### Class의 method decoration

테스트베드를 개발할 때, 에이전트를 클래스 형태로 정의하고 에이전트가 제공하는 기능들은 메소드 형태로 정의되었기 때문에, decorator가 `self` 키워드를 사용하는 method를 수식해줄 필요가 있었고, 이 경우 아래와 같이 키워드를 넣어서 정의해주면 된다.

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

### 예시: authentication_required

테스트베드에서 사용한 예시로, `authentication_required`, `authorization_required` 등이 있다. 그 이름대로, authentication이나 authorization을 진행하는 decorator이며 만약 인증에 실패할 경우 함수를 실행하지 않고 에러 메시지를 반환한다.

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

### 입력를 받는 decorator

더욱이, decorator에서 값을 입력받아 그에 맞춰 처리하도록 만들 수도 있다. 이 경우 아래와 같이 decorator의 def 정의가 한 단계 더 깊어진다. 

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

### Decorator에서 함수에 값 넘겨주기

Decorator에서 뭔가 전처리를 해서 나온 결과를 함수에 넘겨주어 활용할 수 있다. 이 때 원래 함수의 인자를 덮어쓰거나 `kwargs`에 값을 추가해 주는 방식이 가능하다.

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

### 예시: resource_required

테스트베드에서는 `resource_required`를 예시로 들 수 있는데, 해당 에이전트의 기능이 필요로 하는 자원을 입력받아 자원을 검색하고 확보한 다음, 사용할 자원의 정보를 함수에 다시 넘겨주는 것까지 가능하다. 해당 자원의 사용이 끝난 후에는 자원을 unbind/release하는 것까지 자동으로 해줄 수 있다.

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

Decorator를 정의할 때 함수가 아니라 클래스 형태로 할 수도 있지만 이번 테스트베드 개발 때는 사용하지 않았으므로 생략한다. 

---

## 함수와 클래스의 메타 정보 decoration

Decorator를 사용해 함수의 앞뒤로 처리를 해주는 것까지는 좋았는데, 함수의 메타 정보를 자동으로 생성하는 기능을 decorator로 구현할 수는 없을까 해서 찾아보았고, 성공했다. 이 경우 decorator가 함수의 실행 단계가 아니라 함수의 정의 단계에서 작용하기 때문에 문법이 조금 달라진다. 요점은, '함수를 실행하고 그 결과를 반환하는 함수'를 반환하는 대신 함수 그 자체를 반환한다.

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

심지어는 함수가 아니라 클래스까지도 decoration할 수 있었다. 문법은 함수의 경우와 동일하다.

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

### 예시: 서비스 에이전트

결과적으로 위의 내용들을 종합한 서비스 에이전트 예시는 아래와 같다.

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

앞으로도 decorator는 매우 유용하게 사용할 것 같고, 이번에 느낀 바로는 굉장히 많은 기능들을 깔끔하게 자동화할 수 있어서 좋았다.